import type { AxiosError, AxiosResponse } from "axios";
import type { InterceptorConfig } from "../../api";
import { InterceptorType } from "../../api";
import {
  TimeoutError,
  ServerError,
  ClientError,
  NetworkError,
  AbortedError,
} from "../../Error";

export function ErrorHandlerResponseInterceptor(): InterceptorConfig<InterceptorType.RESPONSE> {
  function getErrorMessage(response: AxiosResponse, fallback: string): string {
    // Non-default error responses inside a message key
    if (response.data && response.data.message) {
      return response.data.message;
    }

    // rfc 7807 compliant errors
    if (response.data && response.data?.detail) {
      return response.data.detail;
    }

    // hydra errors
    if (response.data && response.data?.["hydra:description"]) {
      return response.data["hydra:description"];
    }

    return fallback;
  }

  async function resolved(response: AxiosResponse): Promise<AxiosResponse> {
    if (response.status >= 400 && response.status < 500) {
      throw new ClientError(response.config, response.request, response);
    }
    if (response.status >= 500 && response.status < 600) {
      throw new ServerError(response.config, response.request, response);
    }

    return response;
  }

  async function rejected(error: AxiosError): Promise<AxiosError> {
    // Unknown unhandled error.
    console.log("got here", error);
    if (!error?.config) {
      throw error;
    }
    if (error?.code === "ETIMEDOUT") {
      throw new TimeoutError("A timeout error occurred.", error);
    }
    if (error?.code === "ECONNABORTED") {
      throw new AbortedError("A request was aborted.", error);
    }
    if (!error?.response) {
      throw new NetworkError("A network error occurred.", error);
    }
    if (error.response.status >= 400 && error.response.status < 500) {
      throw new ClientError(
        error.config,
        error.request,
        error.response,
        getErrorMessage(error.response, "base.api.client_error"),
        "0",
        error,
      );
    }
    if (error.response.status >= 500 && error.response.status < 600) {
      throw new ServerError(
        error.config,
        error.request,
        error.response,
        getErrorMessage(error.response, "base.api.server_error"),
        "0",
        error,
      );
    }

    throw error;
  }

  return {
    name: "ErrorHandlerResponseInterceptor",
    type: InterceptorType.RESPONSE,
    priority: -1000,
    rejected,
    resolved,
  };
}

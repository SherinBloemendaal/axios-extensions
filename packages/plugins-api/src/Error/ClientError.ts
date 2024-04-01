import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";

export default class ClientError extends AxiosError {
  constructor(
    config: InternalAxiosRequestConfig,
    request: any,
    response: AxiosResponse,
    message: string = "A client error occurred.",
    code: string = "0",
  ) {
    super(message, code, config, request, response);
    this.message = message;
    this.name = "ClientError";
    this.status = response.status;
    this.config = config;
    this.request = request;
    this.response = response;

    if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ClientError);
    }
  }

  status: number;
  config: InternalAxiosRequestConfig;
  request: any;
  response: AxiosResponse;
}

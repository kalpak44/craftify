package com.craftify.backend.error;

import org.springframework.http.HttpStatus;

public final class ApiException extends RuntimeException {

  private final HttpStatus status;
  private final String errorCode;

  private ApiException(HttpStatus status, String errorCode) {
    super(errorCode);
    this.status = status;
    this.errorCode = errorCode;
  }

  public static ApiException badRequest(String errorCode) {
    return new ApiException(HttpStatus.BAD_REQUEST, errorCode);
  }

  public static ApiException unauthorized(String errorCode) {
    return new ApiException(HttpStatus.UNAUTHORIZED, errorCode);
  }

  public static ApiException notFound(String errorCode) {
    return new ApiException(HttpStatus.NOT_FOUND, errorCode);
  }

  public static ApiException conflict(String errorCode) {
    return new ApiException(HttpStatus.CONFLICT, errorCode);
  }

  public static ApiException preconditionFailed(String errorCode) {
    return new ApiException(HttpStatus.PRECONDITION_FAILED, errorCode);
  }

  public static ApiException internalServerError(String errorCode) {
    return new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }

  public HttpStatus getStatus() {
    return status;
  }

  public String getErrorCode() {
    return errorCode;
  }
}

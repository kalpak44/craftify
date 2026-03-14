package com.craftify.backend.error;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  public static final String ERROR_CODE_HEADER = "X-Error-Code";
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ProblemDetail> handleApiException(ApiException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(ex.getStatus());
    problem.setTitle(ex.getStatus().getReasonPhrase());
    problem.setDetail(ex.getErrorCode());
    problem.setProperty("errorCode", ex.getErrorCode());

    return ResponseEntity.status(ex.getStatus())
        .header(HttpHeaders.CONTENT_TYPE, "application/problem+json")
        .header(ERROR_CODE_HEADER, ex.getErrorCode())
        .body(problem);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(400);
    problem.setTitle("Bad Request");
    problem.setDetail("validation_failed");

    Map<String, String> errors = new LinkedHashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(
            fieldError ->
                errors.put(
                    fieldError.getField(),
                    Objects.requireNonNullElse(fieldError.getDefaultMessage(), "Invalid value")));
    problem.setProperty("errorCode", "validation_failed");
    problem.setProperty("errors", errors);

    return ResponseEntity.badRequest()
        .header(HttpHeaders.CONTENT_TYPE, "application/problem+json")
        .header(ERROR_CODE_HEADER, "validation_failed")
        .body(problem);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetail> handleUnexpectedException(Exception ex) {
    log.error("Unhandled request failure", ex);

    ProblemDetail problem = ProblemDetail.forStatus(500);
    problem.setTitle("Internal Server Error");
    problem.setDetail("internal_error");
    problem.setProperty("errorCode", "internal_error");

    return ResponseEntity.internalServerError()
        .header(HttpHeaders.CONTENT_TYPE, "application/problem+json")
        .header(ERROR_CODE_HEADER, "internal_error")
        .body(problem);
  }
}

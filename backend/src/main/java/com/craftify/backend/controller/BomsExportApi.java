package com.craftify.backend.controller;

import com.craftify.backend.model.BomStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.Nullable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.request.NativeWebRequest;

@Validated
@Tag(name = "BOMs", description = "the BOMs API")
public interface BomsExportApi {

  default Optional<NativeWebRequest> getRequest() {
    return Optional.empty();
  }

  String PATH_BOMS_EXPORT_GET = "/boms:export";

  @Operation(
      operationId = "bomsExportGet",
      summary = "Export BOMs with components as CSV",
      tags = {"BOMs"},
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "CSV stream",
            content = {
              @Content(
                  mediaType = "text/csv",
                  schema = @Schema(implementation = org.springframework.core.io.Resource.class))
            })
      },
      security = {@SecurityRequirement(name = "bearerAuth")})
  @RequestMapping(
      method = RequestMethod.GET,
      value = PATH_BOMS_EXPORT_GET,
      produces = {"text/csv"})
  default ResponseEntity<org.springframework.core.io.Resource> bomsExportGet(
      @Parameter(name = "q", in = ParameterIn.QUERY)
          @Valid
          @RequestParam(value = "q", required = false)
          @Nullable
          String q,
      @Parameter(name = "status", in = ParameterIn.QUERY)
          @Valid
          @RequestParam(value = "status", required = false)
          @Nullable
          BomStatus status,
      @Parameter(
              name = "ids",
              description = "Optional selection (comma-separated BOM codes)",
              in = ParameterIn.QUERY)
          @Valid
          @RequestParam(value = "ids", required = false)
          @Nullable
          String ids) {
    return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
  }
}

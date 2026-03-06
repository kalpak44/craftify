package com.craftify.backend.controller;

import com.craftify.backend.model.ImportResult;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.multipart.MultipartFile;

@Validated
@Tag(name = "BOMs", description = "the BOMs API")
public interface BomsImportApi {

  default Optional<NativeWebRequest> getRequest() {
    return Optional.empty();
  }

  String PATH_BOMS_IMPORT_POST = "/boms:import";

  @Operation(
      operationId = "bomsImportPost",
      summary = "Import BOMs with components via CSV",
      tags = {"BOMs"},
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Import result",
            content = {
              @Content(
                  mediaType = "application/json",
                  schema = @Schema(implementation = ImportResult.class))
            })
      },
      security = {@SecurityRequirement(name = "bearerAuth")})
  @RequestMapping(
      method = RequestMethod.POST,
      value = PATH_BOMS_IMPORT_POST,
      produces = {"application/json"},
      consumes = {"multipart/form-data"})
  default ResponseEntity<ImportResult> bomsImportPost(
      @Parameter(name = "file", required = true)
          @RequestPart(value = "file", required = true)
          MultipartFile file,
      @Parameter(name = "mode", description = "Import behavior", in = ParameterIn.QUERY)
          @Valid
          @RequestParam(value = "mode", required = false, defaultValue = "upsert")
          String mode) {
    return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
  }
}

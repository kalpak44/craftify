/*
 * NOTE: This class mirrors ItemsApi for BOM operations.
 */
package com.craftify.backend.api;

import com.craftify.backend.api.model.BomDetail;
import com.craftify.backend.api.model.BomPage;
import com.craftify.backend.api.model.BomStatus;
import com.craftify.backend.api.model.ProblemDetail;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.request.NativeWebRequest;

import java.util.Optional;

@Validated
@Tag(name = "BOMs", description = "the BOMs API")
public interface BomsApi {

    default Optional<NativeWebRequest> getRequest() { return Optional.empty(); }

    String PATH_BOMS_GET = "/boms";

    @Operation(
            operationId = "bomsGet",
            summary = "List BOMs (pageable, filterable, sortable)",
            tags = {"BOMs"},
            responses = { @ApiResponse(responseCode = "200", description = "Paged result",
                    content = { @Content(mediaType = "application/json", schema = @Schema(implementation = BomPage.class)) }) },
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @RequestMapping(method = RequestMethod.GET, value = PATH_BOMS_GET, produces = {"application/json"})
    default ResponseEntity<BomPage> bomsGet(
            @Min(0) @Parameter(name = "page", in = ParameterIn.QUERY) @Valid @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @Min(1) @Max(200) @Parameter(name = "size", in = ParameterIn.QUERY) @Valid @RequestParam(value = "size", required = false, defaultValue = "8") Integer size,
            @Parameter(name = "sort", description = "e.g. productName,asc", in = ParameterIn.QUERY) @Valid @RequestParam(value = "sort", required = false) @Nullable String sort,
            @Parameter(name = "q", description = "Search by id or product name", in = ParameterIn.QUERY) @Valid @RequestParam(value = "q", required = false) @Nullable String q,
            @Parameter(name = "status", in = ParameterIn.QUERY) @Valid @RequestParam(value = "status", required = false) @Nullable BomStatus status
    ) {
        getRequest().ifPresent(request -> {
            for (MediaType mediaType : MediaType.parseMediaTypes(request.getHeader("Accept"))) {
                if (mediaType.isCompatibleWith(MediaType.valueOf("application/json"))) {
                    String exampleString = "{\n  \"size\":8,\n  \"page\":0,\n  \"totalPages\":1,\n  \"content\":[{\"id\":\"BOM-001\",\"productId\":\"ITM-001\",\"productName\":\"Sample\",\"revision\":\"v1\",\"status\":\"Draft\",\"componentsCount\":2}]\n}";
                    ApiUtil.setExampleResponse(request, "application/json", exampleString);
                    break;
                }
            }
        });
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    String PATH_BOMS_ID = "/boms/{id}";

    @Operation(
            operationId = "bomsIdGet",
            summary = "Get BOM by id",
            tags = {"BOMs"},
            responses = {
                    @ApiResponse(responseCode = "200", description = "OK", content = {@Content(mediaType = "application/json", schema = @Schema(implementation = BomDetail.class))}),
                    @ApiResponse(responseCode = "404", description = "Not Found")
            },
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @RequestMapping(method = RequestMethod.GET, value = PATH_BOMS_ID, produces = {"application/json"})
    default ResponseEntity<BomDetail> bomsIdGet(@Parameter(in = ParameterIn.PATH, name = "id") @PathVariable("id") String id) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @Operation(
            operationId = "bomsPost",
            summary = "Create a BOM",
            tags = {"BOMs"},
            responses = {
                    @ApiResponse(responseCode = "201", description = "Created", content = {@Content(mediaType = "application/json", schema = @Schema(implementation = BomDetail.class))}),
                    @ApiResponse(responseCode = "400", description = "Bad Request", content = {@Content(mediaType = "application/json", schema = @Schema(implementation = ProblemDetail.class))}),
                    @ApiResponse(responseCode = "409", description = "Conflict")
            },
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @RequestMapping(method = RequestMethod.POST, value = PATH_BOMS_GET, produces = {"application/json"}, consumes = {"application/json"})
    default ResponseEntity<BomDetail> bomsPost(@Valid @RequestBody(required = false) BomDetail createRequest) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @Operation(
            operationId = "bomsIdPut",
            summary = "Update a BOM",
            tags = {"BOMs"},
            responses = {
                    @ApiResponse(responseCode = "200", description = "OK", content = {@Content(mediaType = "application/json", schema = @Schema(implementation = BomDetail.class))}),
                    @ApiResponse(responseCode = "412", description = "Precondition Failed")
            },
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @RequestMapping(method = RequestMethod.PUT, value = PATH_BOMS_ID, produces = {"application/json"}, consumes = {"application/json"})
    default ResponseEntity<BomDetail> bomsIdPut(@Parameter(in = ParameterIn.PATH, name = "id") @PathVariable("id") String id,
                                                @RequestHeader(value = "If-Match", required = false) String ifMatch,
                                                @Valid @RequestBody(required = false) BomDetail updateRequest) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @Operation(
            operationId = "bomsIdDelete",
            summary = "Delete a BOM",
            tags = {"BOMs"},
            responses = {@ApiResponse(responseCode = "204", description = "No Content"), @ApiResponse(responseCode = "412", description = "Precondition Failed")},
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @RequestMapping(method = RequestMethod.DELETE, value = PATH_BOMS_ID)
    default ResponseEntity<Void> bomsIdDelete(@Parameter(in = ParameterIn.PATH, name = "id") @PathVariable("id") String id,
                                              @RequestHeader(value = "If-Match", required = false) String ifMatch) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}

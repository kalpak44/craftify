package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * ItemUom
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ItemUom implements Serializable {

    private static final long serialVersionUID = 1L;

    private String uom;

    private BigDecimal coef;

    private @Nullable String notes;

    public ItemUom() {
        super();
    }

    /**
     * Constructor with only required parameters
     */
    public ItemUom(String uom, BigDecimal coef) {
        this.uom = uom;
        this.coef = coef;
    }

    public ItemUom uom(String uom) {
        this.uom = uom;
        return this;
    }

    /**
     * Get uom
     *
     * @return uom
     */
    @NotNull
    @Size(min = 1, max = 16)
    @Schema(name = "uom", example = "box", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("uom")
    public String getUom() {
        return uom;
    }

    public void setUom(String uom) {
        this.uom = uom;
    }

    public ItemUom coef(BigDecimal coef) {
        this.coef = coef;
        return this;
    }

    /**
     * Get coef
     *
     * @return coef
     */
    @NotNull
    @Valid
    @Schema(name = "coef", example = "10", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("coef")
    public BigDecimal getCoef() {
        return coef;
    }

    public void setCoef(BigDecimal coef) {
        this.coef = coef;
    }

    public ItemUom notes(@Nullable String notes) {
        this.notes = notes;
        return this;
    }

    /**
     * Get notes
     *
     * @return notes
     */
    @Size(max = 200)
    @Schema(name = "notes", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("notes")
    public @Nullable String getNotes() {
        return notes;
    }

    public void setNotes(@Nullable String notes) {
        this.notes = notes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ItemUom itemUom = (ItemUom) o;
        return Objects.equals(this.uom, itemUom.uom) &&
                Objects.equals(this.coef, itemUom.coef) &&
                Objects.equals(this.notes, itemUom.notes);
    }

    @Override
    public int hashCode() {
        return Objects.hash(uom, coef, notes);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ItemUom {\n");
        sb.append("    uom: ").append(toIndentedString(uom)).append("\n");
        sb.append("    coef: ").append(toIndentedString(coef)).append("\n");
        sb.append("    notes: ").append(toIndentedString(notes)).append("\n");
        sb.append("}");
        return sb.toString();
    }

    /**
     * Convert the given object to string with each line indented by 4 spaces
     * (except the first line).
     */
    private String toIndentedString(Object o) {
        if (o == null) {
            return "null";
        }
        return o.toString().replace("\n", "\n    ");
    }
}


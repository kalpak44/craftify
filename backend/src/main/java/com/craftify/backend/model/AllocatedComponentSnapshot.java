package com.craftify.backend.model;

import java.math.BigDecimal;

public record AllocatedComponentSnapshot(
    String itemId, String itemName, String itemCategoryName, String uom, BigDecimal allocatedQty) {}

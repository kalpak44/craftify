package com.craftify.backend.model;

public record InventoryQuery(int page, int size, String sort, String q, String categoryName, String uom) {}

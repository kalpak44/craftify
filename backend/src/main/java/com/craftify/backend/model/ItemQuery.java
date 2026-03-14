package com.craftify.backend.model;

public record ItemQuery(
    int page,
    int size,
    String sort,
    String q,
    Status status,
    String categoryName,
    String uom,
    boolean includeDeleted) {}

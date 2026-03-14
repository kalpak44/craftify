package com.craftify.backend.model;

public record BomQuery(int page, int size, String sort, String q, BomStatus status) {}

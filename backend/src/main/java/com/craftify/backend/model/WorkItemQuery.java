package com.craftify.backend.model;

public record WorkItemQuery(int page, int size, String sort, String q, WorkItemStatus status) {}

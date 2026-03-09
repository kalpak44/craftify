package com.craftify.backend.service.csv;

import com.craftify.backend.model.ImportResult;
import org.springframework.http.HttpStatus;

public record CsvImportExecution(HttpStatus status, ImportResult body) {}

package com.craftify.backend.utils;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.InputStreamResource;

public final class TempFileResource extends InputStreamResource {

  private final Path path;
  private final String filename;
  private final long contentLength;

  private TempFileResource(Path path, String filename, long contentLength) throws IOException {
    super(openDeletingStream(path));
    this.path = path;
    this.filename = filename;
    this.contentLength = contentLength;
  }

  public static TempFileResource from(Path path, String filename) throws IOException {
    return new TempFileResource(path, filename, Files.size(path));
  }

  @Override
  public String getFilename() {
    return filename;
  }

  @Override
  public long contentLength() {
    return contentLength;
  }

  @Override
  public boolean exists() {
    return Files.exists(path);
  }

  private static InputStream openDeletingStream(Path path) throws IOException {
    InputStream inputStream = Files.newInputStream(path);
    return new FilterInputStream(inputStream) {
      @Override
      public void close() throws IOException {
        try {
          super.close();
        } finally {
          Files.deleteIfExists(path);
        }
      }
    };
  }
}

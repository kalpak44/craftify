package com.craftify.backend.config;

import com.craftify.backend.model.BomStatus;
import com.craftify.backend.model.Status;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class EnumParamConvertersConfig implements WebMvcConfigurer {

  @Override
  public void addFormatters(FormatterRegistry registry) {
    registry.addConverter(new StringToStatusConverter());
    registry.addConverter(new StringToBomStatusConverter());
  }

  private static final class StringToStatusConverter implements Converter<String, Status> {
    @Override
    public Status convert(String source) {
      if (source == null || source.isBlank()) {
        return null;
      }
      return Status.fromValue(source);
    }
  }

  private static final class StringToBomStatusConverter implements Converter<String, BomStatus> {
    @Override
    public BomStatus convert(String source) {
      if (source == null || source.isBlank()) {
        return null;
      }
      return BomStatus.fromValue(source);
    }
  }
}

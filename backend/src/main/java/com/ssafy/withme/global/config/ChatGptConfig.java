package com.ssafy.withme.global.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatGptConfig {
    public static final String AUTHORIZATION = "Authorization";
    public static final String BEARER = "Bearer ";
    public static final String CHAT_MODEL = "gpt-4-turbo";
    public static final Integer MAX_TOKEN = 1000;
    public static final Boolean STREAM = true;
    public static final String ROLE = "user";
    public static final Double TEMPERATURE = 0.6;
    //public static final Double TOP_P = 1.0;
    public static final String MEDIA_TYPE = "application/json; charset=UTF-8";
    public static final String CHAT_URL = "https://api.openai.com/v1/chat/completions";
}
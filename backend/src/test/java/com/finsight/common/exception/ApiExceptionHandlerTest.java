package com.finsight.common.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

class ApiExceptionHandlerTest {
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new FaultController())
        .setControllerAdvice(new ApiExceptionHandler())
        .build();

    @Test
    void malformedJsonReturnsSafeBadRequest() throws Exception {
        mvc.perform(post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("invalid_request"))
            .andExpect(jsonPath("$.message").value("Request body is invalid"));
    }

    @Test
    void validationFailureReturnsSafeBadRequest() throws Exception {
        mvc.perform(post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("invalid_request"))
            .andExpect(jsonPath("$.message").value("Request validation failed"));
    }

    @Test
    void unexpectedErrorDoesNotExposeExceptionDetails() throws Exception {
        mvc.perform(get("/test/failure"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.code").value("internal_error"))
            .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    @RestController
    static class FaultController {
        @PostMapping("/test/body")
        void body(@Valid @RequestBody Payload body) {}

        @GetMapping("/test/failure")
        void failure() {
            throw new IllegalStateException("private server detail");
        }
    }

    record Payload(@NotBlank String value) {}
}

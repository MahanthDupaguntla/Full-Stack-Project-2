package com.artforge.dto;

import com.artforge.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank @Size(min = 2, max = 100)
    private String name;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 6)
    private String password;

    @Builder.Default
    private UserRole role = UserRole.VISITOR;
}

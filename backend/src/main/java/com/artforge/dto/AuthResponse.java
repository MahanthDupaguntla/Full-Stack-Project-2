package com.artforge.dto;

import com.artforge.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private String token;
    private String id;
    private String name;
    private String email;
    private UserRole role;
    private String avatar;
    private BigDecimal walletBalance;
    private String subscription;
    private BigDecimal totalEarned;
}

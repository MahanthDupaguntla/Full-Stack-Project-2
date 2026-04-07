package com.artforge.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BidRequest {
    @NotNull
    @Min(1)
    private BigDecimal amount;
}

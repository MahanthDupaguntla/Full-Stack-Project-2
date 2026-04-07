package com.artforge.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ArtworkRequest {
    private String title;
    private String artist;
    private String description;
    private Integer year;
    private String imageUrl;
    private BigDecimal price;
    private String category;
    private Boolean isAuction = false;
    private Integer auctionDurationHours = 24;
}

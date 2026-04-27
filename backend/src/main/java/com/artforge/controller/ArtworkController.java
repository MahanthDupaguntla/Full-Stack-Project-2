package com.artforge.controller;

import com.artforge.dto.ArtworkRequest;
import com.artforge.dto.BidRequest;
import com.artforge.model.Artwork;
import com.artforge.model.Bid;
import com.artforge.service.ArtworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
public class ArtworkController {

    private final ArtworkService artworkService;

    // GET /api/artworks — all listed artworks
    @GetMapping
    public ResponseEntity<List<Artwork>> getAll() {
        return ResponseEntity.ok(artworkService.getAllListed());
    }

    // GET /api/artworks/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Artwork> getById(@PathVariable String id) {
        return ResponseEntity.ok(artworkService.getById(id));
    }

    // GET /api/artworks/search?q=...
    @GetMapping("/search")
    public ResponseEntity<List<Artwork>> search(@RequestParam String q) {
        return ResponseEntity.ok(artworkService.search(q));
    }

    // POST /api/artworks — create (Artist/Admin)
    @PreAuthorize("hasAnyRole('ARTIST', 'ADMIN')")
    @PostMapping
    public ResponseEntity<Artwork> create(@RequestBody ArtworkRequest req,
                                          @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(artworkService.create(req, user.getUsername()));
    }

    // POST /api/artworks/{id}/purchase
    @PostMapping("/{id}/purchase")
    public ResponseEntity<Map<String, String>> purchase(@PathVariable String id,
                                                        @AuthenticationPrincipal UserDetails user) {
        artworkService.purchase(id, user.getUsername());
        return ResponseEntity.ok(Map.of("message", "Artwork purchased successfully!"));
    }

    // POST /api/artworks/{id}/bid
    @PostMapping("/{id}/bid")
    public ResponseEntity<Bid> bid(@PathVariable String id,
                                   @Valid @RequestBody BidRequest req,
                                   @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(artworkService.placeBid(id, req.getAmount(), user.getUsername()));
    }

    // PUT /api/artworks/{id}/list
    @PutMapping("/{id}/list")
    public ResponseEntity<Artwork> updateListing(@PathVariable String id,
                                                 @RequestBody Map<String, Object> body,
                                                 @AuthenticationPrincipal UserDetails user) {
        boolean isListed = Boolean.parseBoolean(body.get("isListed").toString());
        java.math.BigDecimal price = null;
        if (body.get("price") != null) {
            price = new java.math.BigDecimal(body.get("price").toString());
        }
        return ResponseEntity.ok(artworkService.updateListing(id, isListed, price, user.getUsername()));
    }

    // PUT /api/artworks/{id} — edit artwork details (Artist/Admin)
    @PutMapping("/{id}")
    public ResponseEntity<Artwork> update(@PathVariable String id,
                                          @RequestBody ArtworkRequest req,
                                          @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(artworkService.update(id, req, user.getUsername()));
    }

    // DELETE /api/artworks/{id} — remove artwork (Artist/Admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id,
                                                      @AuthenticationPrincipal UserDetails user) {
        artworkService.delete(id, user.getUsername());
        return ResponseEntity.ok(Map.of("message", "Artwork deleted successfully"));
    }
}

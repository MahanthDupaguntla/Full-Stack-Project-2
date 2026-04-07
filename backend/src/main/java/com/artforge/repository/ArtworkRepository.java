package com.artforge.repository;

import com.artforge.model.Artwork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ArtworkRepository extends JpaRepository<Artwork, String> {
    List<Artwork> findByIsListedTrue();
    List<Artwork> findByArtist(String artist);
    List<Artwork> findByCategory(String category);
    List<Artwork> findByIsAuctionTrue();

    @Query("SELECT a FROM Artwork a WHERE a.isListed = true AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.artist) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.category) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Artwork> searchArtworks(String query);
}

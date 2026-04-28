package com.artforge.config;

import com.artforge.model.Artwork;
import com.artforge.model.Exhibition;
import com.artforge.model.User;
import com.artforge.model.UserRole;
import com.artforge.repository.ArtworkRepository;
import com.artforge.repository.ExhibitionRepository;
import com.artforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ArtworkRepository artworkRepository;
    private final ExhibitionRepository exhibitionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Seeding database with initial data...");

            // Create Users
            User admin = User.builder()
                    .name("Admin User")
                    .email("admin@art.com")
                    .password(passwordEncoder.encode("password"))
                    .role(UserRole.ADMIN)
                    .walletBalance(new BigDecimal("1000000"))
                    .build();
            userRepository.save(admin);

            User curator = User.builder()
                    .name("Curator Jane")
                    .email("jane@art.com")
                    .password(passwordEncoder.encode("password"))
                    .role(UserRole.CURATOR)
                    .walletBalance(new BigDecimal("50000"))
                    .build();
            userRepository.save(curator);

            User artist = User.builder()
                    .name("Sora Kim")
                    .email("sora@art.com")
                    .password(passwordEncoder.encode("password"))
                    .role(UserRole.ARTIST)
                    .walletBalance(new BigDecimal("25000"))
                    .build();
            userRepository.save(artist);

            User collector = User.builder()
                    .name("Ravi Kumar")
                    .email("ravi@art.com")
                    .password(passwordEncoder.encode("password"))
                    .role(UserRole.VISITOR)
                    .walletBalance(new BigDecimal("125000"))
                    .build();
            userRepository.save(collector);

            // Create Artworks
            Artwork art1 = Artwork.builder()
                    .title("Echoes of Eternity")
                    .artist("Elena Vance")
                    .description("An abstract exploration of time and memory using layered gold leaf and deep cerulean pigments.")
                    .year(2023)
                    .imageUrl("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1000")
                    .price(new BigDecimal("4500"))
                    .category("Abstract")
                    .isAuction(true)
                    .currentBid(new BigDecimal("4200"))
                    .bidEndTime(LocalDateTime.now().plusDays(1))
                    .owner(artist)
                    .currentOwnerName(artist.getName())
                    .build();
            artworkRepository.save(art1);

            Artwork art2 = Artwork.builder()
                    .title("The Silent Watcher")
                    .artist("Marcus Thorne")
                    .description("A hyper-realistic charcoal portrait capturing the wisdom of the coastal elders.")
                    .year(2022)
                    .imageUrl("https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000")
                    .price(new BigDecimal("3200"))
                    .category("Realism")
                    .owner(artist)
                    .currentOwnerName(artist.getName())
                    .build();
            artworkRepository.save(art2);

            Artwork art3 = Artwork.builder()
                    .title("Neon Renaissance")
                    .artist("Sora Kim")
                    .description("Classic sculpture forms reimagined with cyberpunk aesthetic and digital projections.")
                    .year(2024)
                    .imageUrl("https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1000")
                    .price(new BigDecimal("8900"))
                    .category("Mixed Media")
                    .owner(artist)
                    .currentOwnerName(artist.getName())
                    .build();
            artworkRepository.save(art3);

            // Create Exhibitions
            Exhibition ex1 = Exhibition.builder()
                    .title("Digital Horizons")
                    .theme("Technology & Human Nature")
                    .curator(curator)
                    .bannerUrl("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200")
                    .description("Exploring the intersection of classical art techniques and the digital age.")
                    .status(Exhibition.ExhibitionStatus.active)
                    .artworks(List.of(art1, art3))
                    .build();
            exhibitionRepository.save(ex1);

            System.out.println("Database seeding completed successfully!");
        }
    }
}

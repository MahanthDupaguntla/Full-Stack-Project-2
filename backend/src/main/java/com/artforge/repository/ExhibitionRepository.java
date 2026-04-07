package com.artforge.repository;

import com.artforge.model.Exhibition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExhibitionRepository extends JpaRepository<Exhibition, String> {
    List<Exhibition> findByStatus(Exhibition.ExhibitionStatus status);
}

package com.edl.repository;

import com.edl.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    Page<SupportTicket> findByUserId(UUID userId, Pageable pageable);
    Page<SupportTicket> findByTicketTypeAndStatus(String ticketType, String status, Pageable pageable);
    Page<SupportTicket> findByTicketType(String ticketType, Pageable pageable);
    Page<SupportTicket> findByStatus(String status, Pageable pageable);
}

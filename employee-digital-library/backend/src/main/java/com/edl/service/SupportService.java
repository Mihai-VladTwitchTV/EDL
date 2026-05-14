package com.edl.service;

import com.edl.dto.request.AuthRequests.SupportTicketRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.SupportTicket;
import com.edl.entity.User;
import com.edl.exception.ApiException;
import com.edl.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportTicketRepository ticketRepo;

    @Transactional
    public SupportTicketResponse create(User user, SupportTicketRequest req) {
        SupportTicket ticket = SupportTicket.builder()
            .user(user)
            .ticketType(req.getTicketType())
            .subject(req.getSubject())
            .description(req.getDescription())
            .build();
        ticketRepo.save(ticket);
        return toResponse(ticket);
    }

    @Transactional(readOnly = true)
    public PagedResponse<SupportTicketResponse> getMyTickets(UUID userId, Pageable pageable) {
        return toPagedResponse(ticketRepo.findByUserId(userId, pageable));
    }

    @Transactional(readOnly = true)
    public PagedResponse<SupportTicketResponse> getAll(String status, Pageable pageable) {
        Page<SupportTicket> page = status != null
            ? ticketRepo.findByStatus(status, pageable)
            : ticketRepo.findAll(pageable);
        return toPagedResponse(page);
    }

    @Transactional
    public SupportTicketResponse resolve(UUID ticketId) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new ApiException("Ticket not found", HttpStatus.NOT_FOUND));
        ticket.setStatus("RESOLVED");
        ticket.setResolvedAt(OffsetDateTime.now());
        ticketRepo.save(ticket);
        return toResponse(ticket);
    }

    private PagedResponse<SupportTicketResponse> toPagedResponse(Page<SupportTicket> page) {
        return PagedResponse.<SupportTicketResponse>builder()
            .content(page.getContent().stream().map(this::toResponse).toList())
            .page(page.getNumber()).size(page.getSize())
            .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
            .last(page.isLast()).build();
    }

    private SupportTicketResponse toResponse(SupportTicket t) {
        return SupportTicketResponse.builder()
            .id(t.getId())
            .ticketType(t.getTicketType())
            .subject(t.getSubject())
            .description(t.getDescription())
            .status(t.getStatus())
            .createdAt(t.getCreatedAt())
            .resolvedAt(t.getResolvedAt())
            .build();
    }
}

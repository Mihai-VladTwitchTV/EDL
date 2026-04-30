package com.edl.service;

import com.edl.dto.request.AuthRequests.LoginRequest;
import com.edl.dto.request.AuthRequests.RegisterRequest;
import com.edl.dto.response.Responses.AuthResponse;
import com.edl.dto.response.Responses.UserSummary;
import com.edl.entity.Department;
import com.edl.entity.User;
import com.edl.entity.User.LanguageCode;
import com.edl.entity.User.UserRole;
import com.edl.exception.ApiException;
import com.edl.repository.DepartmentRepository;
import com.edl.repository.UserRepository;
import com.edl.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final DepartmentRepository deptRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
            .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isActive()) {
            throw new ApiException("Account is disabled", HttpStatus.FORBIDDEN);
        }

        user.setLastLoginAt(OffsetDateTime.now());
        userRepo.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }

        Department dept = null;
        if (req.getDepartmentId() != null) {
            dept = deptRepo.findById(UUID.fromString(req.getDepartmentId()))
                .orElseThrow(() -> new ApiException("Department not found", HttpStatus.NOT_FOUND));
        }

        User user = User.builder()
            .email(req.getEmail())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .fullName(req.getFullName())
            .role(UserRole.EMPLOYEE)
            .department(dept)
            .preferredLang(LanguageCode.valueOf(req.getPreferredLang().toUpperCase()))
            .build();

        userRepo.save(user);
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .user(toSummary(user))
            .build();
    }

    public static UserSummary toSummary(User user) {
        return UserSummary.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .role(user.getRole().name())
            .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
            .departmentId(user.getDepartment() != null ? user.getDepartment().getId().toString() : null)
            .avatarUrl(user.getAvatarUrl())
            .preferredLang(user.getPreferredLang().name())
            .build();
    }
}

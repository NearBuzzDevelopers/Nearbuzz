package com.studentseva.follows;

import com.studentseva.follows.dto.FollowStatusResponse;
import com.studentseva.follows.dto.FollowedBusinessResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for business follow relationships and follower counts.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Follows", description = "Endpoints for following businesses, tracking follower counts, and viewing subscriptions")
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/businesses/{businessId}/follow")
    @Operation(summary = "Follow a business (authenticated)")
    public ResponseEntity<FollowStatusResponse> followBusiness(
            @PathVariable UUID businessId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(followService.followBusiness(businessId, authentication.getName()));
    }

    @DeleteMapping("/businesses/{businessId}/follow")
    @Operation(summary = "Unfollow a business (authenticated)")
    public ResponseEntity<FollowStatusResponse> unfollowBusiness(
            @PathVariable UUID businessId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(followService.unfollowBusiness(businessId, authentication.getName()));
    }

    @GetMapping("/businesses/{businessId}/follow/status")
    @Operation(summary = "Check whether the current user follows a business (authenticated)")
    public ResponseEntity<FollowStatusResponse> getFollowStatus(
            @PathVariable UUID businessId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(followService.getFollowStatus(businessId, authentication.getName()));
    }

    @GetMapping("/businesses/{businessId}/followers/count")
    @Operation(summary = "Get total follower count for a business (public)")
    public ResponseEntity<Map<String, Object>> getFollowerCount(@PathVariable UUID businessId) {
        return ResponseEntity.ok(Map.of(
                "businessId", businessId,
                "followerCount", followService.getFollowerCount(businessId)
        ));
    }

    @GetMapping("/follows/my")
    @Operation(summary = "List businesses followed by the current user (authenticated)")
    public ResponseEntity<List<FollowedBusinessResponse>> getMyFollows(Authentication authentication) {
        return ResponseEntity.ok(followService.getMyFollowedBusinesses(authentication.getName()));
    }
}

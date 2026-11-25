package com.studentseva.follows;

import com.studentseva.businesses.Business;
import com.studentseva.businesses.BusinessRepository;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.follows.dto.FollowStatusResponse;
import com.studentseva.follows.dto.FollowedBusinessResponse;
import com.studentseva.users.User;
import com.studentseva.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service managing idempotent follow/unfollow actions, follower counts,
 * and a user's list of followed businesses.
 */
@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    public FollowService(
            FollowRepository followRepository,
            BusinessRepository businessRepository,
            UserRepository userRepository
    ) {
        this.followRepository = followRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
    }

    /**
     * Subscribes the authenticated user to updates from a business (idempotent).
     */
    @Transactional
    public FollowStatusResponse followBusiness(UUID businessId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Business not found with ID: " + businessId));

        if (!followRepository.existsByUserIdAndBusinessId(user.getId(), businessId)) {
            Follow follow = new Follow();
            follow.setUser(user);
            follow.setBusiness(business);
            followRepository.saveAndFlush(follow);
        }

        return new FollowStatusResponse(businessId, true, followRepository.countByBusinessId(businessId));
    }

    /**
     * Removes the authenticated user's follow relationship with a business (idempotent).
     */
    @Transactional
    public FollowStatusResponse unfollowBusiness(UUID businessId, String userEmail) {
        User user = getUserByEmail(userEmail);
        requireBusinessExists(businessId);

        followRepository.deleteByUserIdAndBusinessId(user.getId(), businessId);
        return new FollowStatusResponse(businessId, false, followRepository.countByBusinessId(businessId));
    }

    /**
     * Checks whether the authenticated user currently follows the specified business.
     */
    @Transactional(readOnly = true)
    public FollowStatusResponse getFollowStatus(UUID businessId, String userEmail) {
        User user = getUserByEmail(userEmail);
        requireBusinessExists(businessId);

        boolean isFollowing = followRepository.existsByUserIdAndBusinessId(user.getId(), businessId);
        long count = followRepository.countByBusinessId(businessId);
        return new FollowStatusResponse(businessId, isFollowing, count);
    }

    /**
     * Returns the public follower count for a business.
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(UUID businessId) {
        requireBusinessExists(businessId);
        return followRepository.countByBusinessId(businessId);
    }

    /**
     * Lists all businesses currently followed by the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<FollowedBusinessResponse> getMyFollowedBusinesses(String userEmail) {
        User user = getUserByEmail(userEmail);
        return followRepository.findByUserIdWithBusinessOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(f -> {
                    Business b = f.getBusiness();
                    return new FollowedBusinessResponse(
                            b.getId(),
                            b.getName(),
                            b.getCategory().name(),
                            b.getAddress(),
                            b.getStatus().name(),
                            f.getCreatedAt()
                    );
                })
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found with email: " + email));
    }

    private void requireBusinessExists(UUID businessId) {
        if (!businessRepository.existsById(businessId)) {
            throw new NotFoundException("Business not found with ID: " + businessId);
        }
    }
}

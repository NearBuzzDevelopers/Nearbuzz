package com.studentseva.businesses;

import com.studentseva.businesses.dto.BusinessHoursEntryRequest;
import com.studentseva.businesses.dto.BusinessHoursResponse;
import com.studentseva.businesses.dto.BusinessScheduleResponse;
import com.studentseva.businesses.dto.UpsertBusinessHoursRequest;
import com.studentseva.common.exceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Service managing weekly operating hours and real-time `openNow` computation.
 */
@Service
public class BusinessHoursService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final String[] DAY_NAMES = {
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };

    private final BusinessHoursRepository hoursRepository;
    private final BusinessRepository businessRepository;
    private final BusinessService businessService;

    public BusinessHoursService(
            BusinessHoursRepository hoursRepository,
            BusinessRepository businessRepository,
            BusinessService businessService
    ) {
        this.hoursRepository = hoursRepository;
        this.businessRepository = businessRepository;
        this.businessService = businessService;
    }

    /**
     * Inserts or updates weekly operating hours for the business owned by the caller.
     */
    @Transactional
    public BusinessScheduleResponse upsertSchedule(
            UUID businessId,
            UpsertBusinessHoursRequest request,
            String userEmail
    ) {
        Business business = businessService.getOwnedBusiness(businessId, userEmail);

        Set<Integer> seenDays = new HashSet<>();
        for (BusinessHoursEntryRequest entry : request.schedule()) {
            if (!seenDays.add(entry.dayOfWeek())) {
                throw new IllegalArgumentException("Duplicate dayOfWeek in schedule: " + entry.dayOfWeek());
            }
            if (!entry.isClosed() && (entry.opensAt() == null || entry.closesAt() == null)) {
                throw new IllegalArgumentException(
                        "opensAt and closesAt are required when day " + DAY_NAMES[entry.dayOfWeek()] + " is open.");
            }
        }

        List<BusinessHours> toSave = request.schedule().stream()
                .map(entry -> {
                    Short day = entry.dayOfWeek().shortValue();
                    BusinessHours hours = hoursRepository.findByBusinessIdAndDayOfWeek(businessId, day)
                            .orElseGet(() -> {
                                BusinessHours created = new BusinessHours();
                                created.setBusiness(business);
                                created.setDayOfWeek(day);
                                return created;
                            });
                    hours.setClosed(entry.isClosed());
                    hours.setOpensAt(entry.isClosed() ? null : entry.opensAt());
                    hours.setClosesAt(entry.isClosed() ? null : entry.closesAt());
                    return hours;
                })
                .toList();

        hoursRepository.saveAllAndFlush(toSave);
        return buildScheduleResponse(businessId);
    }

    /**
     * Returns the full weekly operating hours and live `openNow` status for a business.
     */
    @Transactional(readOnly = true)
    public BusinessScheduleResponse getSchedule(UUID businessId) {
        if (!businessRepository.existsById(businessId)) {
            throw new NotFoundException("Business not found with ID: " + businessId);
        }
        return buildScheduleResponse(businessId);
    }

    private BusinessScheduleResponse buildScheduleResponse(UUID businessId) {
        List<BusinessHours> entries = hoursRepository.findByBusinessIdOrderByDayOfWeekAsc(businessId);
        boolean openNow = isCurrentlyOpen(entries);

        List<BusinessHoursResponse> responses = entries.stream()
                .map(h -> new BusinessHoursResponse(
                        h.getId(),
                        businessId,
                        h.getDayOfWeek(),
                        DAY_NAMES[h.getDayOfWeek()],
                        h.getOpensAt(),
                        h.getClosesAt(),
                        h.isClosed()
                ))
                .toList();

        return new BusinessScheduleResponse(businessId, openNow, responses);
    }

    private boolean isCurrentlyOpen(List<BusinessHours> entries) {
        if (entries.isEmpty()) {
            return false;
        }
        ZonedDateTime nowIst = ZonedDateTime.now(INDIA_ZONE);
        // java.time.DayOfWeek: MONDAY=1 .. SUNDAY=7 -> % 7 gives SUNDAY=0 .. SATURDAY=6
        int todayIndex = nowIst.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : nowIst.getDayOfWeek().getValue();
        LocalTime currentTime = nowIst.toLocalTime();

        return entries.stream()
                .filter(h -> h.getDayOfWeek() == todayIndex)
                .findFirst()
                .map(today -> isWithinWindow(today, currentTime))
                .orElse(false);
    }

    private boolean isWithinWindow(BusinessHours hours, LocalTime now) {
        if (hours.isClosed() || hours.getOpensAt() == null || hours.getClosesAt() == null) {
            return false;
        }
        LocalTime open = hours.getOpensAt();
        LocalTime close = hours.getClosesAt();
        if (!close.isBefore(open)) {
            return !now.isBefore(open) && !now.isAfter(close);
        }
        // Handles overnight hours (e.g. 20:00 to 02:00)
        return !now.isBefore(open) || !now.isAfter(close);
    }
}

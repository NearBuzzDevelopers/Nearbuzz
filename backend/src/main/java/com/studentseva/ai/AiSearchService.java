package com.studentseva.ai;

import com.studentseva.ai.dto.AiSearchMatch;
import com.studentseva.ai.dto.AiSearchResponse;
import com.studentseva.ai.dto.ParsedSearchIntent;
import com.studentseva.businesses.BusinessService;
import com.studentseva.businesses.dto.NearbyBusinessResponse;
import com.studentseva.offerings.Offering;
import com.studentseva.offerings.OfferingService;
import com.studentseva.offerings.dto.OfferingResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

/**
 * Combines AI-parsed natural-language intent with PostGIS spatial search
 * and live offering price/attribute filtering.
 */
@Service
public class AiSearchService {

    private final AiQueryParserService parserService;
    private final BusinessService businessService;
    private final OfferingService offeringService;

    public AiSearchService(
            AiQueryParserService parserService,
            BusinessService businessService,
            OfferingService offeringService
    ) {
        this.parserService = parserService;
        this.businessService = businessService;
        this.offeringService = offeringService;
    }

    /**
     * Parses a student's query and returns matching nearby businesses and offerings.
     */
    @Transactional(readOnly = true)
    public AiSearchResponse search(String query, Double lat, Double lng) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Search query must not be blank.");
        }

        ParsedSearchIntent intent = parserService.parse(query.trim());

        List<NearbyBusinessResponse> nearbyBusinesses = businessService.searchNearby(
                lat, lng, intent.radiusMeters(), intent.category());

        List<AiSearchMatch> matches = nearbyBusinesses.stream()
                .map(biz -> matchBusinessAndOfferings(biz, intent))
                .filter(match -> match != null)
                .toList();

        // Fallback: if nothing matched within the local radius (e.g. different city/campus or shop
        // not yet GPS-updated), search all open shops so owners' newly added listings remain discoverable.
        if (matches.isEmpty()) {
            List<NearbyBusinessResponse> allBusinesses = businessService.listAllOpenBusinesses(
                    lat, lng, intent.category());
            matches = allBusinesses.stream()
                    .map(biz -> matchBusinessAndOfferings(biz, intent))
                    .filter(match -> match != null)
                    .toList();
        }

        return new AiSearchResponse(query.trim(), intent, matches.size(), matches);
    }

    private AiSearchMatch matchBusinessAndOfferings(NearbyBusinessResponse biz, ParsedSearchIntent intent) {
        List<OfferingResponse> availableOfferings = offeringService.getOfferingsByBusiness(
                biz.id(), null, Offering.Status.AVAILABLE);

        BigDecimal maxPrice = intent.maxPrice();
        List<String> keywords = intent.keywords();

        List<OfferingResponse> matchingOfferings = availableOfferings.stream()
                .filter(off -> maxPrice == null || off.price().compareTo(maxPrice) <= 0)
                .filter(off -> matchesAnyKeyword(off, biz, keywords))
                .toList();

        // If a budget cap was explicitly requested, require at least one offering within budget
        if (maxPrice != null && matchingOfferings.isEmpty()) {
            return null;
        }

        // If no budget cap, allow business-level keyword match (e.g. "PG near me")
        if (maxPrice == null && matchingOfferings.isEmpty() && !businessMatchesKeywords(biz, keywords)) {
            return null;
        }

        return new AiSearchMatch(biz, matchingOfferings);
    }

    private boolean matchesAnyKeyword(
            OfferingResponse offering,
            NearbyBusinessResponse biz,
            List<String> keywords
    ) {
        if (keywords.isEmpty()) {
            return true;
        }
        String offeringCorpus = (offering.title() + " " + offering.offeringType() + " " + offering.attributes())
                .toLowerCase(Locale.ROOT);
        String combinedCorpus = (offeringCorpus + " " + businessCorpus(biz)).toLowerCase(Locale.ROOT);

        return keywords.stream().anyMatch(combinedCorpus::contains);
    }

    private boolean businessMatchesKeywords(NearbyBusinessResponse biz, List<String> keywords) {
        if (keywords.isEmpty()) {
            return true;
        }
        String corpus = businessCorpus(biz);
        return keywords.stream().anyMatch(corpus::contains);
    }

    private String businessCorpus(NearbyBusinessResponse biz) {
        return (biz.name() + " " + biz.category() + " "
                + (biz.description() != null ? biz.description() : "") + " "
                + biz.address()).toLowerCase(Locale.ROOT);
    }
}

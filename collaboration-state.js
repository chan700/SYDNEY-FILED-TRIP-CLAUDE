(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SydneyCollaboration = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function createCollaborationState() {
    return {
      candidates: [],
      finalIds: [],
      customDaySpots: {},
    };
  }

  function normalizeState(state) {
    return {
      candidates: Array.isArray(state && state.candidates) ? state.candidates : [],
      finalIds: Array.isArray(state && state.finalIds) ? state.finalIds.map(String) : [],
      customDaySpots: normalizeCustomDaySpots(state && state.customDaySpots),
    };
  }

  function normalizeCustomDaySpots(customDaySpots) {
    if (!customDaySpots || typeof customDaySpots !== "object") return {};
    return Object.entries(customDaySpots).reduce((days, entry) => {
      const day = entry[0];
      const spots = entry[1];
      days[day] = Array.isArray(spots)
        ? spots.map((spot) => ({ ...spot, id: String(spot.id) }))
        : [];
      return days;
    }, {});
  }

  function addCandidate(state, candidate) {
    const current = normalizeState(state);
    return {
      ...current,
      candidates: [
        ...current.candidates,
        {
          ...candidate,
          id: String(candidate.id),
        },
      ],
    };
  }

  function getCandidatesForStudent(state, owner, day) {
    const current = normalizeState(state);
    return current.candidates.filter((candidate) => {
      return candidate.owner === owner && (!day || candidate.day === day);
    });
  }

  function addFinalCandidates(state, ids) {
    const current = normalizeState(state);
    const merged = [...current.finalIds, ...ids.map(String)];
    return {
      ...current,
      finalIds: Array.from(new Set(merged)),
    };
  }

  function getFinalCandidates(state) {
    const current = normalizeState(state);
    const selected = new Set(current.finalIds);
    return current.candidates.filter((candidate) => selected.has(String(candidate.id)));
  }

  function addDaySpot(state, day, spot) {
    const current = normalizeState(state);
    const daySpots = current.customDaySpots[day] || [];
    return {
      ...current,
      customDaySpots: {
        ...current.customDaySpots,
        [day]: [
          ...daySpots,
          {
            ...spot,
            id: String(spot.id),
            day,
          },
        ],
      },
    };
  }

  function getDaySpots(state, day) {
    const current = normalizeState(state);
    return current.customDaySpots[day] || [];
  }

  function removeDaySpot(state, day, spotId) {
    const current = normalizeState(state);
    const daySpots = current.customDaySpots[day] || [];
    return {
      ...current,
      customDaySpots: {
        ...current.customDaySpots,
        [day]: daySpots.filter((spot) => String(spot.id) !== String(spotId)),
      },
    };
  }

  function serializeState(state) {
    return JSON.stringify(normalizeState(state));
  }

  function hydrateState(serialized) {
    if (!serialized) return createCollaborationState();
    try {
      return normalizeState(JSON.parse(serialized));
    } catch (error) {
      return createCollaborationState();
    }
  }

  return {
    createCollaborationState,
    addCandidate,
    getCandidatesForStudent,
    getFinalCandidates,
    addFinalCandidates,
    addDaySpot,
    getDaySpots,
    removeDaySpot,
    serializeState,
    hydrateState,
  };
});

# Glossary

**Pool**: the DAO's auto-delegation Safe (`AUTO_DELEGATION_POOL_ADDRESS`). Its power is its Snapshot voting power (Gnosis `votingPower`): own tokens plus power delegated in. Not its token balance.

**Run**: one published score run of the Delegate Score API, identified by `run_id` and its as-of. Each run freezes its scores, cohorts, pool and cap.

**As-of**: the UTC day a run scores. The run reads the pool at the block closing that day; this app reads the pool live.

**Cap**: the most pool power a run allocates, frozen in the run and served by `GET /v1/allocation` (`null` = uncapped). Power above it is voided.

**Allocated**: the pool power a run distributes: the pool, up to the cap. The Score API calls the run's value `effective`; the pool banner computes it from the live pool.

**DAO vote**: a proposal in the DAO's main Snapshot space. Any token holder can vote, weighted by their voting power.

**Committee vote**: a proposal in a committee's Snapshot space (Leads, Operators, Grants, Multisig). Only the committee's whitelisted members can vote. Avoid "closed vote": closed means a vote has ended.

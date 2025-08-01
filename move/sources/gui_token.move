module gui_token::gui_token {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, Coin, MintCapability, BurnCapability};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;
    const E_NOT_INITIALIZED: u64 = 4;
    const E_INSUFFICIENT_STAKE: u64 = 5;

    /// GUI Token struct
    struct GUIToken has key {}

    /// Capabilities for minting and burning
    struct TokenCapabilities has key {
        mint_cap: MintCapability<GUIToken>,
        burn_cap: BurnCapability<GUIToken>,
    }

    /// Staking information
    struct StakeInfo has store {
        amount: u64,
        timestamp: u64,
        reward_debt: u64,
    }

    /// Global state
    struct GlobalState has key {
        total_staked: u64,
        reward_per_second: u64,
        admin: address,
        stakes: Table<address, StakeInfo>,
        premium_users: Table<address, bool>,
    }

    /// Initialize the token
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<GlobalState>(admin_addr), E_ALREADY_INITIALIZED);

        // Initialize coin
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<GUIToken>(
            admin,
            string::utf8(b"DeFAI GUI Token"),
            string::utf8(b"GUI"),
            8,
            true,
        );

        // Store capabilities
        move_to(admin, TokenCapabilities {
            mint_cap,
            burn_cap,
        });

        // Mint initial supply (1B tokens)
        let initial_supply = 1000000000 * 100000000; // 1B with 8 decimals
        let coins = coin::mint<GUIToken>(initial_supply, &mint_cap);
        coin::deposit(admin_addr, coins);

        // Initialize global state
        move_to(admin, GlobalState {
            total_staked: 0,
            reward_per_second: 31709, // ~1% APY
            admin: admin_addr,
            stakes: table::new(),
            premium_users: table::new(),
        });

        coin::destroy_freeze_cap(freeze_cap);
    }

    /// Stake GUI tokens
    public entry fun stake(account: &signer, amount: u64) acquires GlobalState, TokenCapabilities {
        let account_addr = signer::address_of(account);
        let state = borrow_global_mut<GlobalState>(@gui_token);
        
        assert!(coin::balance<GUIToken>(account_addr) >= amount, E_INSUFFICIENT_BALANCE);

        // Claim pending rewards if already staking
        if (table::contains(&state.stakes, account_addr)) {
            claim_rewards_internal(account_addr, state);
        } else {
            table::add(&mut state.stakes, account_addr, StakeInfo {
                amount: 0,
                timestamp: timestamp::now_seconds(),
                reward_debt: 0,
            });
        };

        // Transfer tokens to contract
        let coins = coin::withdraw<GUIToken>(account, amount);
        coin::deposit(@gui_token, coins);

        // Update stake info
        let stake = table::borrow_mut(&mut state.stakes, account_addr);
        stake.amount = stake.amount + amount;
        stake.timestamp = timestamp::now_seconds();
        stake.reward_debt = stake.amount * state.reward_per_second * timestamp::now_seconds();

        state.total_staked = state.total_staked + amount;

        // Grant premium if staked >= 500 GUI
        if (stake.amount >= 50000000000) { // 500 * 10^8
            if (!table::contains(&state.premium_users, account_addr)) {
                table::add(&mut state.premium_users, account_addr, true);
            } else {
                *table::borrow_mut(&mut state.premium_users, account_addr) = true;
            };
        };
    }

    /// Unstake GUI tokens
    public entry fun unstake(account: &signer, amount: u64) acquires GlobalState, TokenCapabilities {
        let account_addr = signer::address_of(account);
        let state = borrow_global_mut<GlobalState>(@gui_token);
        
        assert!(table::contains(&state.stakes, account_addr), E_NOT_INITIALIZED);
        
        let stake = table::borrow(&state.stakes, account_addr);
        assert!(stake.amount >= amount, E_INSUFFICIENT_STAKE);

        // Claim rewards first
        claim_rewards_internal(account_addr, state);

        // Update stake info
        let stake = table::borrow_mut(&mut state.stakes, account_addr);
        stake.amount = stake.amount - amount;
        state.total_staked = state.total_staked - amount;

        // Remove premium if below threshold
        if (stake.amount < 50000000000) { // 500 * 10^8
            if (table::contains(&state.premium_users, account_addr)) {
                *table::borrow_mut(&mut state.premium_users, account_addr) = false;
            };
        };

        // Transfer tokens back
        let coins = coin::withdraw<GUIToken>(account, amount);
        coin::deposit(account_addr, coins);
    }

    /// Claim staking rewards
    public entry fun claim_rewards(account: &signer) acquires GlobalState, TokenCapabilities {
        let account_addr = signer::address_of(account);
        let state = borrow_global_mut<GlobalState>(@gui_token);
        claim_rewards_internal(account_addr, state);
    }

    /// Internal function to claim rewards
    fun claim_rewards_internal(account_addr: address, state: &mut GlobalState) acquires TokenCapabilities {
        if (!table::contains(&state.stakes, account_addr)) {
            return
        };

        let stake = table::borrow_mut(&mut state.stakes, account_addr);
        if (stake.amount == 0) {
            return
        };

        let time_staked = timestamp::now_seconds() - stake.timestamp;
        let reward = (stake.amount * state.reward_per_second * time_staked) - stake.reward_debt;

        if (reward > 0) {
            // Mint reward tokens
            let capabilities = borrow_global<TokenCapabilities>(@gui_token);
            let reward_coins = coin::mint<GUIToken>(reward, &capabilities.mint_cap);
            coin::deposit(account_addr, reward_coins);
            
            stake.reward_debt = stake.reward_debt + reward;
        };
    }

    /// Reward prediction winners (admin only)
    public entry fun reward_prediction(
        admin: &signer, 
        user: address, 
        amount: u64
    ) acquires GlobalState, TokenCapabilities {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global<GlobalState>(@gui_token);
        assert!(admin_addr == state.admin, E_NOT_ADMIN);

        let capabilities = borrow_global<TokenCapabilities>(@gui_token);
        let reward_coins = coin::mint<GUIToken>(amount, &capabilities.mint_cap);
        coin::deposit(user, reward_coins);
    }

    /// Get stake information
    #[view]
    public fun get_stake_info(user: address): (u64, u64, bool) acquires GlobalState {
        let state = borrow_global<GlobalState>(@gui_token);
        
        if (!table::contains(&state.stakes, user)) {
            return (0, 0, false)
        };

        let stake = table::borrow(&state.stakes, user);
        let is_premium = table::contains(&state.premium_users, user) && 
                        *table::borrow(&state.premium_users, user);

        let pending_reward = if (stake.amount > 0) {
            let time_staked = timestamp::now_seconds() - stake.timestamp;
            (stake.amount * state.reward_per_second * time_staked) - stake.reward_debt
        } else {
            0
        };

        (stake.amount, pending_reward, is_premium)
    }

    /// Check if user has premium access
    #[view]
    public fun has_premium_access(user: address): bool acquires GlobalState {
        let state = borrow_global<GlobalState>(@gui_token);
        table::contains(&state.premium_users, user) && 
        *table::borrow(&state.premium_users, user)
    }

    /// Get total staked amount
    #[view]
    public fun get_total_staked(): u64 acquires GlobalState {
        let state = borrow_global<GlobalState>(@gui_token);
        state.total_staked
    }
}

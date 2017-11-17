export declare class IdleWatcher {
    target: HTMLElement;
    onIdle?: () => void;
    constructor(target: HTMLElement);
    private idlePromise;
    private idleFulfill?;
    resetIdlePromise(): void;
    private fulfillIdle();
    isCurrentlyTouching: boolean;
    onTouchStart(): void;
    onTouchEnd(): void;
    scrollCompleteTimeout: any;
    onScroll(): void;
    onScrollComplete(): void;
}

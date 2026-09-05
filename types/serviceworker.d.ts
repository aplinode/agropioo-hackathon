/**
 * Service worker types for lib/serwist/sw.ts.
 * The DOM lib only declares `ServiceWorker` (a Worker), not the SW global
 * scope. This minimal declaration matches the shape Serwist expects at runtime.
 */

declare interface ServiceWorkerGlobalScope extends EventTarget {
  importScripts(...urls: string[]): void;
  readonly registration: ServiceWorkerRegistration;
  readonly clients: Clients;
  readonly navigationPreload: NavigationPreloadManager;
  readonly serviceWorker: ServiceWorker;
  addEventListener(
    type: "install",
    listener: (this: ServiceWorkerGlobalScope, ev: InstallEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: "activate",
    listener: (this: ServiceWorkerGlobalScope, ev: ExtendableEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: "fetch",
    listener: (this: ServiceWorkerGlobalScope, ev: FetchEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

declare interface Clients {
  matchAll(options?: ClientQueryOptions): Promise<ReadonlyArray<Client>>;
}

declare interface ClientQueryOptions {
  includeUncontrolled?: boolean;
  type?: "all" | "window" | "worker" | "shared";
}

declare interface Client extends EventTarget {
  readonly frameType: "auxiliary" | "top-level" | "nested" | "none";
  readonly id: string;
  readonly type: "window" | "worker" | "shared" | "unknown";
  readonly url: string;
  postMessage(data: unknown, transferable: ReadonlyArray<unknown>): void;
}

declare interface NavigationPreloadManager {
  enable(): Promise<void>;
  disable(): Promise<void>;
  setHeaderValue(value: string | null): Promise<void>;
  getState(): Promise<NavigationPreloadState>;
  setArguments(arguments_: unknown): Promise<void>;
}

declare interface NavigationPreloadState {
  active: boolean;
  requested: boolean;
  channel: MessagePort;
}


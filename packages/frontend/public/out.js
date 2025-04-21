"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.js
  var require_eventemitter3 = __commonJS({
    "../../node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.js"(exports, module) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      var prefix = "~";
      function Events() {
      }
      if (Object.create) {
        Events.prototype = /* @__PURE__ */ Object.create(null);
        if (!new Events().__proto__) prefix = false;
      }
      function EE(fn, context, once) {
        this.fn = fn;
        this.context = context;
        this.once = once || false;
      }
      function addListener(emitter, event, fn, context, once) {
        if (typeof fn !== "function") {
          throw new TypeError("The listener must be a function");
        }
        var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
        if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
        else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
        else emitter._events[evt] = [emitter._events[evt], listener];
        return emitter;
      }
      function clearEvent(emitter, evt) {
        if (--emitter._eventsCount === 0) emitter._events = new Events();
        else delete emitter._events[evt];
      }
      function EventEmitter2() {
        this._events = new Events();
        this._eventsCount = 0;
      }
      EventEmitter2.prototype.eventNames = function eventNames() {
        var names = [], events, name;
        if (this._eventsCount === 0) return names;
        for (name in events = this._events) {
          if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
        }
        if (Object.getOwnPropertySymbols) {
          return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
      };
      EventEmitter2.prototype.listeners = function listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
          ee[i] = handlers[i].fn;
        }
        return ee;
      };
      EventEmitter2.prototype.listenerCount = function listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners) return 0;
        if (listeners.fn) return 1;
        return listeners.length;
      };
      EventEmitter2.prototype.emit = function emit2(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return false;
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }
          for (i = 1, args = new Array(len - 1); i < len; i++) {
            args[i - 1] = arguments[i];
          }
          listeners.fn.apply(listeners.context, args);
        } else {
          var length = listeners.length, j;
          for (i = 0; i < length; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
            switch (len) {
              case 1:
                listeners[i].fn.call(listeners[i].context);
                break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);
                break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);
                break;
              case 4:
                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                break;
              default:
                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
                listeners[i].fn.apply(listeners[i].context, args);
            }
          }
        }
        return true;
      };
      EventEmitter2.prototype.on = function on2(event, fn, context) {
        return addListener(this, event, fn, context, false);
      };
      EventEmitter2.prototype.once = function once(event, fn, context) {
        return addListener(this, event, fn, context, true);
      };
      EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) {
          clearEvent(this, evt);
          return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
          if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
            clearEvent(this, evt);
          }
        } else {
          for (var i = 0, events = [], length = listeners.length; i < length; i++) {
            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
              events.push(listeners[i]);
            }
          }
          if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
          else clearEvent(this, evt);
        }
        return this;
      };
      EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
        var evt;
        if (event) {
          evt = prefix ? prefix + event : event;
          if (this._events[evt]) clearEvent(this, evt);
        } else {
          this._events = new Events();
          this._eventsCount = 0;
        }
        return this;
      };
      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
      EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
      EventEmitter2.prefixed = prefix;
      EventEmitter2.EventEmitter = EventEmitter2;
      if ("undefined" !== typeof module) {
        module.exports = EventEmitter2;
      }
    }
  });

  // ../../node_modules/.pnpm/xstate@5.19.2/node_modules/xstate/dev/dist/xstate-dev.esm.js
  function getGlobal() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof global !== "undefined") {
      return global;
    }
  }
  function getDevTools() {
    const w = getGlobal();
    if (w.__xstate__) {
      return w.__xstate__;
    }
    return void 0;
  }
  var devToolsAdapter = (service) => {
    if (typeof window === "undefined") {
      return;
    }
    const devTools = getDevTools();
    if (devTools) {
      devTools.register(service);
    }
  };

  // ../../node_modules/.pnpm/xstate@5.19.2/node_modules/xstate/dist/raise-c17ec2bc.esm.js
  var Mailbox = class {
    constructor(_process) {
      this._process = _process;
      this._active = false;
      this._current = null;
      this._last = null;
    }
    start() {
      this._active = true;
      this.flush();
    }
    clear() {
      if (this._current) {
        this._current.next = null;
        this._last = this._current;
      }
    }
    enqueue(event) {
      const enqueued = {
        value: event,
        next: null
      };
      if (this._current) {
        this._last.next = enqueued;
        this._last = enqueued;
        return;
      }
      this._current = enqueued;
      this._last = enqueued;
      if (this._active) {
        this.flush();
      }
    }
    flush() {
      while (this._current) {
        const consumed = this._current;
        this._process(consumed.value);
        this._current = consumed.next;
      }
      this._last = null;
    }
  };
  var STATE_DELIMITER = ".";
  var TARGETLESS_KEY = "";
  var NULL_EVENT = "";
  var STATE_IDENTIFIER = "#";
  var WILDCARD = "*";
  var XSTATE_INIT = "xstate.init";
  var XSTATE_STOP = "xstate.stop";
  function createAfterEvent(delayRef, id) {
    return {
      type: `xstate.after.${delayRef}.${id}`
    };
  }
  function createDoneStateEvent(id, output) {
    return {
      type: `xstate.done.state.${id}`,
      output
    };
  }
  function createDoneActorEvent(invokeId, output) {
    return {
      type: `xstate.done.actor.${invokeId}`,
      output,
      actorId: invokeId
    };
  }
  function createErrorActorEvent(id, error) {
    return {
      type: `xstate.error.actor.${id}`,
      error,
      actorId: id
    };
  }
  function createInitEvent(input) {
    return {
      type: XSTATE_INIT,
      input
    };
  }
  function reportUnhandledError(err) {
    setTimeout(() => {
      throw err;
    });
  }
  var symbolObservable = (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
  function matchesState(parentStateId, childStateId) {
    const parentStateValue = toStateValue(parentStateId);
    const childStateValue = toStateValue(childStateId);
    if (typeof childStateValue === "string") {
      if (typeof parentStateValue === "string") {
        return childStateValue === parentStateValue;
      }
      return false;
    }
    if (typeof parentStateValue === "string") {
      return parentStateValue in childStateValue;
    }
    return Object.keys(parentStateValue).every((key) => {
      if (!(key in childStateValue)) {
        return false;
      }
      return matchesState(parentStateValue[key], childStateValue[key]);
    });
  }
  function toStatePath(stateId) {
    if (isArray(stateId)) {
      return stateId;
    }
    const result = [];
    let segment = "";
    for (let i = 0; i < stateId.length; i++) {
      const char = stateId.charCodeAt(i);
      switch (char) {
        // \
        case 92:
          segment += stateId[i + 1];
          i++;
          continue;
        // .
        case 46:
          result.push(segment);
          segment = "";
          continue;
      }
      segment += stateId[i];
    }
    result.push(segment);
    return result;
  }
  function toStateValue(stateValue) {
    if (isMachineSnapshot(stateValue)) {
      return stateValue.value;
    }
    if (typeof stateValue !== "string") {
      return stateValue;
    }
    const statePath = toStatePath(stateValue);
    return pathToStateValue(statePath);
  }
  function pathToStateValue(statePath) {
    if (statePath.length === 1) {
      return statePath[0];
    }
    const value2 = {};
    let marker = value2;
    for (let i = 0; i < statePath.length - 1; i++) {
      if (i === statePath.length - 2) {
        marker[statePath[i]] = statePath[i + 1];
      } else {
        const previous = marker;
        marker = {};
        previous[statePath[i]] = marker;
      }
    }
    return value2;
  }
  function mapValues(collection, iteratee) {
    const result = {};
    const collectionKeys = Object.keys(collection);
    for (let i = 0; i < collectionKeys.length; i++) {
      const key = collectionKeys[i];
      result[key] = iteratee(collection[key], key, collection, i);
    }
    return result;
  }
  function toArrayStrict(value2) {
    if (isArray(value2)) {
      return value2;
    }
    return [value2];
  }
  function toArray(value2) {
    if (value2 === void 0) {
      return [];
    }
    return toArrayStrict(value2);
  }
  function resolveOutput(mapper, context, event, self2) {
    if (typeof mapper === "function") {
      return mapper({
        context,
        event,
        self: self2
      });
    }
    return mapper;
  }
  function isArray(value2) {
    return Array.isArray(value2);
  }
  function isErrorActorEvent(event) {
    return event.type.startsWith("xstate.error.actor");
  }
  function toTransitionConfigArray(configLike) {
    return toArrayStrict(configLike).map((transitionLike) => {
      if (typeof transitionLike === "undefined" || typeof transitionLike === "string") {
        return {
          target: transitionLike
        };
      }
      return transitionLike;
    });
  }
  function normalizeTarget(target) {
    if (target === void 0 || target === TARGETLESS_KEY) {
      return void 0;
    }
    return toArray(target);
  }
  function toObserver(nextHandler, errorHandler, completionHandler) {
    const isObserver = typeof nextHandler === "object";
    const self2 = isObserver ? nextHandler : void 0;
    return {
      next: (isObserver ? nextHandler.next : nextHandler)?.bind(self2),
      error: (isObserver ? nextHandler.error : errorHandler)?.bind(self2),
      complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self2)
    };
  }
  function createInvokeId(stateNodeId, index) {
    return `${index}.${stateNodeId}`;
  }
  function resolveReferencedActor(machine, src) {
    const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
    if (!match) {
      return machine.implementations.actors[src];
    }
    const [, indexStr, nodeId] = match;
    const node = machine.getStateNodeById(nodeId);
    const invokeConfig = node.config.invoke;
    return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
  }
  function createScheduledEventId(actorRef, id) {
    return `${actorRef.sessionId}.${id}`;
  }
  var idCounter = 0;
  function createSystem(rootActor, options) {
    const children = /* @__PURE__ */ new Map();
    const keyedActors = /* @__PURE__ */ new Map();
    const reverseKeyedActors = /* @__PURE__ */ new WeakMap();
    const inspectionObservers = /* @__PURE__ */ new Set();
    const timerMap = {};
    const {
      clock,
      logger
    } = options;
    const scheduler = {
      schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
        const scheduledEvent = {
          source,
          target,
          event,
          delay,
          id,
          startedAt: Date.now()
        };
        const scheduledEventId = createScheduledEventId(source, id);
        system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
        const timeout = clock.setTimeout(() => {
          delete timerMap[scheduledEventId];
          delete system._snapshot._scheduledEvents[scheduledEventId];
          system._relay(source, target, event);
        }, delay);
        timerMap[scheduledEventId] = timeout;
      },
      cancel: (source, id) => {
        const scheduledEventId = createScheduledEventId(source, id);
        const timeout = timerMap[scheduledEventId];
        delete timerMap[scheduledEventId];
        delete system._snapshot._scheduledEvents[scheduledEventId];
        if (timeout !== void 0) {
          clock.clearTimeout(timeout);
        }
      },
      cancelAll: (actorRef) => {
        for (const scheduledEventId in system._snapshot._scheduledEvents) {
          const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
          if (scheduledEvent.source === actorRef) {
            scheduler.cancel(actorRef, scheduledEvent.id);
          }
        }
      }
    };
    const sendInspectionEvent = (event) => {
      if (!inspectionObservers.size) {
        return;
      }
      const resolvedInspectionEvent = {
        ...event,
        rootId: rootActor.sessionId
      };
      inspectionObservers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
    };
    const system = {
      _snapshot: {
        _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {}
      },
      _bookId: () => `x:${idCounter++}`,
      _register: (sessionId, actorRef) => {
        children.set(sessionId, actorRef);
        return sessionId;
      },
      _unregister: (actorRef) => {
        children.delete(actorRef.sessionId);
        const systemId = reverseKeyedActors.get(actorRef);
        if (systemId !== void 0) {
          keyedActors.delete(systemId);
          reverseKeyedActors.delete(actorRef);
        }
      },
      get: (systemId) => {
        return keyedActors.get(systemId);
      },
      _set: (systemId, actorRef) => {
        const existing = keyedActors.get(systemId);
        if (existing && existing !== actorRef) {
          throw new Error(`Actor with system ID '${systemId}' already exists.`);
        }
        keyedActors.set(systemId, actorRef);
        reverseKeyedActors.set(actorRef, systemId);
      },
      inspect: (observerOrFn) => {
        const observer = toObserver(observerOrFn);
        inspectionObservers.add(observer);
        return {
          unsubscribe() {
            inspectionObservers.delete(observer);
          }
        };
      },
      _sendInspectionEvent: sendInspectionEvent,
      _relay: (source, target, event) => {
        system._sendInspectionEvent({
          type: "@xstate.event",
          sourceRef: source,
          actorRef: target,
          event
        });
        target._send(event);
      },
      scheduler,
      getSnapshot: () => {
        return {
          _scheduledEvents: {
            ...system._snapshot._scheduledEvents
          }
        };
      },
      start: () => {
        const scheduledEvents = system._snapshot._scheduledEvents;
        system._snapshot._scheduledEvents = {};
        for (const scheduledId in scheduledEvents) {
          const {
            source,
            target,
            event,
            delay,
            id
          } = scheduledEvents[scheduledId];
          scheduler.schedule(source, target, event, delay, id);
        }
      },
      _clock: clock,
      _logger: logger
    };
    return system;
  }
  var executingCustomAction = false;
  var $$ACTOR_TYPE = 1;
  var ProcessingStatus = /* @__PURE__ */ function(ProcessingStatus2) {
    ProcessingStatus2[ProcessingStatus2["NotStarted"] = 0] = "NotStarted";
    ProcessingStatus2[ProcessingStatus2["Running"] = 1] = "Running";
    ProcessingStatus2[ProcessingStatus2["Stopped"] = 2] = "Stopped";
    return ProcessingStatus2;
  }({});
  var defaultOptions = {
    clock: {
      setTimeout: (fn, ms) => {
        return setTimeout(fn, ms);
      },
      clearTimeout: (id) => {
        return clearTimeout(id);
      }
    },
    logger: console.log.bind(console),
    devTools: false
  };
  var Actor = class {
    /**
     * Creates a new actor instance for the given logic with the provided options,
     * if any.
     *
     * @param logic The logic to create an actor from
     * @param options Actor options
     */
    constructor(logic, options) {
      this.logic = logic;
      this._snapshot = void 0;
      this.clock = void 0;
      this.options = void 0;
      this.id = void 0;
      this.mailbox = new Mailbox(this._process.bind(this));
      this.observers = /* @__PURE__ */ new Set();
      this.eventListeners = /* @__PURE__ */ new Map();
      this.logger = void 0;
      this._processingStatus = ProcessingStatus.NotStarted;
      this._parent = void 0;
      this._syncSnapshot = void 0;
      this.ref = void 0;
      this._actorScope = void 0;
      this._systemId = void 0;
      this.sessionId = void 0;
      this.system = void 0;
      this._doneEvent = void 0;
      this.src = void 0;
      this._deferred = [];
      const resolvedOptions = {
        ...defaultOptions,
        ...options
      };
      const {
        clock,
        logger,
        parent,
        syncSnapshot,
        id,
        systemId,
        inspect
      } = resolvedOptions;
      this.system = parent ? parent.system : createSystem(this, {
        clock,
        logger
      });
      if (inspect && !parent) {
        this.system.inspect(toObserver(inspect));
      }
      this.sessionId = this.system._bookId();
      this.id = id ?? this.sessionId;
      this.logger = options?.logger ?? this.system._logger;
      this.clock = options?.clock ?? this.system._clock;
      this._parent = parent;
      this._syncSnapshot = syncSnapshot;
      this.options = resolvedOptions;
      this.src = resolvedOptions.src ?? logic;
      this.ref = this;
      this._actorScope = {
        self: this,
        id: this.id,
        sessionId: this.sessionId,
        logger: this.logger,
        defer: (fn) => {
          this._deferred.push(fn);
        },
        system: this.system,
        stopChild: (child) => {
          if (child._parent !== this) {
            throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
          }
          child._stop();
        },
        emit: (emittedEvent) => {
          const listeners = this.eventListeners.get(emittedEvent.type);
          const wildcardListener = this.eventListeners.get("*");
          if (!listeners && !wildcardListener) {
            return;
          }
          const allListeners = [...listeners ? listeners.values() : [], ...wildcardListener ? wildcardListener.values() : []];
          for (const handler of allListeners) {
            handler(emittedEvent);
          }
        },
        actionExecutor: (action) => {
          const exec = () => {
            this._actorScope.system._sendInspectionEvent({
              type: "@xstate.action",
              actorRef: this,
              action: {
                type: action.type,
                params: action.params
              }
            });
            if (!action.exec) {
              return;
            }
            const saveExecutingCustomAction = executingCustomAction;
            try {
              executingCustomAction = true;
              action.exec(action.info, action.params);
            } finally {
              executingCustomAction = saveExecutingCustomAction;
            }
          };
          if (this._processingStatus === ProcessingStatus.Running) {
            exec();
          } else {
            this._deferred.push(exec);
          }
        }
      };
      this.send = this.send.bind(this);
      this.system._sendInspectionEvent({
        type: "@xstate.actor",
        actorRef: this
      });
      if (systemId) {
        this._systemId = systemId;
        this.system._set(systemId, this);
      }
      this._initState(options?.snapshot ?? options?.state);
      if (systemId && this._snapshot.status !== "active") {
        this.system._unregister(this);
      }
    }
    _initState(persistedState) {
      try {
        this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
      } catch (err) {
        this._snapshot = {
          status: "error",
          output: void 0,
          error: err
        };
      }
    }
    update(snapshot, event) {
      this._snapshot = snapshot;
      let deferredFn;
      while (deferredFn = this._deferred.shift()) {
        try {
          deferredFn();
        } catch (err) {
          this._deferred.length = 0;
          this._snapshot = {
            ...snapshot,
            status: "error",
            error: err
          };
        }
      }
      switch (this._snapshot.status) {
        case "active":
          for (const observer of this.observers) {
            try {
              observer.next?.(snapshot);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
          break;
        case "done":
          for (const observer of this.observers) {
            try {
              observer.next?.(snapshot);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
          this._stopProcedure();
          this._complete();
          this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
          if (this._parent) {
            this.system._relay(this, this._parent, this._doneEvent);
          }
          break;
        case "error":
          this._error(this._snapshot.error);
          break;
      }
      this.system._sendInspectionEvent({
        type: "@xstate.snapshot",
        actorRef: this,
        event,
        snapshot
      });
    }
    /**
     * Subscribe an observer to an actor’s snapshot values.
     *
     * @remarks
     * The observer will receive the actor’s snapshot value when it is emitted.
     * The observer can be:
     *
     * - A plain function that receives the latest snapshot, or
     * - An observer object whose `.next(snapshot)` method receives the latest
     *   snapshot
     *
     * @example
     *
     * ```ts
     * // Observer as a plain function
     * const subscription = actor.subscribe((snapshot) => {
     *   console.log(snapshot);
     * });
     * ```
     *
     * @example
     *
     * ```ts
     * // Observer as an object
     * const subscription = actor.subscribe({
     *   next(snapshot) {
     *     console.log(snapshot);
     *   },
     *   error(err) {
     *     // ...
     *   },
     *   complete() {
     *     // ...
     *   }
     * });
     * ```
     *
     * The return value of `actor.subscribe(observer)` is a subscription object
     * that has an `.unsubscribe()` method. You can call
     * `subscription.unsubscribe()` to unsubscribe the observer:
     *
     * @example
     *
     * ```ts
     * const subscription = actor.subscribe((snapshot) => {
     *   // ...
     * });
     *
     * // Unsubscribe the observer
     * subscription.unsubscribe();
     * ```
     *
     * When the actor is stopped, all of its observers will automatically be
     * unsubscribed.
     *
     * @param observer - Either a plain function that receives the latest
     *   snapshot, or an observer object whose `.next(snapshot)` method receives
     *   the latest snapshot
     */
    subscribe(nextListenerOrObserver, errorListener, completeListener) {
      const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
      if (this._processingStatus !== ProcessingStatus.Stopped) {
        this.observers.add(observer);
      } else {
        switch (this._snapshot.status) {
          case "done":
            try {
              observer.complete?.();
            } catch (err) {
              reportUnhandledError(err);
            }
            break;
          case "error": {
            const err = this._snapshot.error;
            if (!observer.error) {
              reportUnhandledError(err);
            } else {
              try {
                observer.error(err);
              } catch (err2) {
                reportUnhandledError(err2);
              }
            }
            break;
          }
        }
      }
      return {
        unsubscribe: () => {
          this.observers.delete(observer);
        }
      };
    }
    on(type, handler) {
      let listeners = this.eventListeners.get(type);
      if (!listeners) {
        listeners = /* @__PURE__ */ new Set();
        this.eventListeners.set(type, listeners);
      }
      const wrappedHandler = handler.bind(void 0);
      listeners.add(wrappedHandler);
      return {
        unsubscribe: () => {
          listeners.delete(wrappedHandler);
        }
      };
    }
    /** Starts the Actor from the initial state */
    start() {
      if (this._processingStatus === ProcessingStatus.Running) {
        return this;
      }
      if (this._syncSnapshot) {
        this.subscribe({
          next: (snapshot) => {
            if (snapshot.status === "active") {
              this.system._relay(this, this._parent, {
                type: `xstate.snapshot.${this.id}`,
                snapshot
              });
            }
          },
          error: () => {
          }
        });
      }
      this.system._register(this.sessionId, this);
      if (this._systemId) {
        this.system._set(this._systemId, this);
      }
      this._processingStatus = ProcessingStatus.Running;
      const initEvent = createInitEvent(this.options.input);
      this.system._sendInspectionEvent({
        type: "@xstate.event",
        sourceRef: this._parent,
        actorRef: this,
        event: initEvent
      });
      const status = this._snapshot.status;
      switch (status) {
        case "done":
          this.update(this._snapshot, initEvent);
          return this;
        case "error":
          this._error(this._snapshot.error);
          return this;
      }
      if (!this._parent) {
        this.system.start();
      }
      if (this.logic.start) {
        try {
          this.logic.start(this._snapshot, this._actorScope);
        } catch (err) {
          this._snapshot = {
            ...this._snapshot,
            status: "error",
            error: err
          };
          this._error(err);
          return this;
        }
      }
      this.update(this._snapshot, initEvent);
      if (this.options.devTools) {
        this.attachDevTools();
      }
      this.mailbox.start();
      return this;
    }
    _process(event) {
      let nextState;
      let caughtError;
      try {
        nextState = this.logic.transition(this._snapshot, event, this._actorScope);
      } catch (err) {
        caughtError = {
          err
        };
      }
      if (caughtError) {
        const {
          err
        } = caughtError;
        this._snapshot = {
          ...this._snapshot,
          status: "error",
          error: err
        };
        this._error(err);
        return;
      }
      this.update(nextState, event);
      if (event.type === XSTATE_STOP) {
        this._stopProcedure();
        this._complete();
      }
    }
    _stop() {
      if (this._processingStatus === ProcessingStatus.Stopped) {
        return this;
      }
      this.mailbox.clear();
      if (this._processingStatus === ProcessingStatus.NotStarted) {
        this._processingStatus = ProcessingStatus.Stopped;
        return this;
      }
      this.mailbox.enqueue({
        type: XSTATE_STOP
      });
      return this;
    }
    /** Stops the Actor and unsubscribe all listeners. */
    stop() {
      if (this._parent) {
        throw new Error("A non-root actor cannot be stopped directly.");
      }
      return this._stop();
    }
    _complete() {
      for (const observer of this.observers) {
        try {
          observer.complete?.();
        } catch (err) {
          reportUnhandledError(err);
        }
      }
      this.observers.clear();
    }
    _reportError(err) {
      if (!this.observers.size) {
        if (!this._parent) {
          reportUnhandledError(err);
        }
        return;
      }
      let reportError = false;
      for (const observer of this.observers) {
        const errorListener = observer.error;
        reportError ||= !errorListener;
        try {
          errorListener?.(err);
        } catch (err2) {
          reportUnhandledError(err2);
        }
      }
      this.observers.clear();
      if (reportError) {
        reportUnhandledError(err);
      }
    }
    _error(err) {
      this._stopProcedure();
      this._reportError(err);
      if (this._parent) {
        this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
      }
    }
    // TODO: atm children don't belong entirely to the actor so
    // in a way - it's not even super aware of them
    // so we can't stop them from here but we really should!
    // right now, they are being stopped within the machine's transition
    // but that could throw and leave us with "orphaned" active actors
    _stopProcedure() {
      if (this._processingStatus !== ProcessingStatus.Running) {
        return this;
      }
      this.system.scheduler.cancelAll(this);
      this.mailbox.clear();
      this.mailbox = new Mailbox(this._process.bind(this));
      this._processingStatus = ProcessingStatus.Stopped;
      this.system._unregister(this);
      return this;
    }
    /** @internal */
    _send(event) {
      if (this._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      this.mailbox.enqueue(event);
    }
    /**
     * Sends an event to the running Actor to trigger a transition.
     *
     * @param event The event to send
     */
    send(event) {
      this.system._relay(void 0, this, event);
    }
    attachDevTools() {
      const {
        devTools
      } = this.options;
      if (devTools) {
        const resolvedDevToolsAdapter = typeof devTools === "function" ? devTools : devToolsAdapter;
        resolvedDevToolsAdapter(this);
      }
    }
    toJSON() {
      return {
        xstate$$type: $$ACTOR_TYPE,
        id: this.id
      };
    }
    /**
     * Obtain the internal state of the actor, which can be persisted.
     *
     * @remarks
     * The internal state can be persisted from any actor, not only machines.
     *
     * Note that the persisted state is not the same as the snapshot from
     * {@link Actor.getSnapshot}. Persisted state represents the internal state of
     * the actor, while snapshots represent the actor's last emitted value.
     *
     * Can be restored with {@link ActorOptions.state}
     * @see https://stately.ai/docs/persistence
     */
    getPersistedSnapshot(options) {
      return this.logic.getPersistedSnapshot(this._snapshot, options);
    }
    [symbolObservable]() {
      return this;
    }
    /**
     * Read an actor’s snapshot synchronously.
     *
     * @remarks
     * The snapshot represent an actor's last emitted value.
     *
     * When an actor receives an event, its internal state may change. An actor
     * may emit a snapshot when a state transition occurs.
     *
     * Note that some actors, such as callback actors generated with
     * `fromCallback`, will not emit snapshots.
     * @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
     * @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
     */
    getSnapshot() {
      return this._snapshot;
    }
  };
  function createActor(logic, ...[options]) {
    return new Actor(logic, options);
  }
  function resolveCancel(_, snapshot, actionArgs, actionParams, {
    sendId
  }) {
    const resolvedSendId = typeof sendId === "function" ? sendId(actionArgs, actionParams) : sendId;
    return [snapshot, {
      sendId: resolvedSendId
    }, void 0];
  }
  function executeCancel(actorScope, params) {
    actorScope.defer(() => {
      actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
    });
  }
  function cancel(sendId) {
    function cancel2(_args, _params) {
    }
    cancel2.type = "xstate.cancel";
    cancel2.sendId = sendId;
    cancel2.resolve = resolveCancel;
    cancel2.execute = executeCancel;
    return cancel2;
  }
  function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, {
    id,
    systemId,
    src,
    input,
    syncSnapshot
  }) {
    const logic = typeof src === "string" ? resolveReferencedActor(snapshot.machine, src) : src;
    const resolvedId = typeof id === "function" ? id(actionArgs) : id;
    let actorRef;
    let resolvedInput = void 0;
    if (logic) {
      resolvedInput = typeof input === "function" ? input({
        context: snapshot.context,
        event: actionArgs.event,
        self: actorScope.self
      }) : input;
      actorRef = createActor(logic, {
        id: resolvedId,
        src,
        parent: actorScope.self,
        syncSnapshot,
        systemId,
        input: resolvedInput
      });
    }
    return [cloneMachineSnapshot(snapshot, {
      children: {
        ...snapshot.children,
        [resolvedId]: actorRef
      }
    }), {
      id,
      systemId,
      actorRef,
      src,
      input: resolvedInput
    }, void 0];
  }
  function executeSpawn(actorScope, {
    actorRef
  }) {
    if (!actorRef) {
      return;
    }
    actorScope.defer(() => {
      if (actorRef._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      actorRef.start();
    });
  }
  function spawnChild(...[src, {
    id,
    systemId,
    input,
    syncSnapshot = false
  } = {}]) {
    function spawnChild2(_args, _params) {
    }
    spawnChild2.type = "xstate.spawnChild";
    spawnChild2.id = id;
    spawnChild2.systemId = systemId;
    spawnChild2.src = src;
    spawnChild2.input = input;
    spawnChild2.syncSnapshot = syncSnapshot;
    spawnChild2.resolve = resolveSpawn;
    spawnChild2.execute = executeSpawn;
    return spawnChild2;
  }
  function resolveStop(_, snapshot, args, actionParams, {
    actorRef
  }) {
    const actorRefOrString = typeof actorRef === "function" ? actorRef(args, actionParams) : actorRef;
    const resolvedActorRef = typeof actorRefOrString === "string" ? snapshot.children[actorRefOrString] : actorRefOrString;
    let children = snapshot.children;
    if (resolvedActorRef) {
      children = {
        ...children
      };
      delete children[resolvedActorRef.id];
    }
    return [cloneMachineSnapshot(snapshot, {
      children
    }), resolvedActorRef, void 0];
  }
  function executeStop(actorScope, actorRef) {
    if (!actorRef) {
      return;
    }
    actorScope.system._unregister(actorRef);
    if (actorRef._processingStatus !== ProcessingStatus.Running) {
      actorScope.stopChild(actorRef);
      return;
    }
    actorScope.defer(() => {
      actorScope.stopChild(actorRef);
    });
  }
  function stopChild(actorRef) {
    function stop2(_args, _params) {
    }
    stop2.type = "xstate.stopChild";
    stop2.actorRef = actorRef;
    stop2.resolve = resolveStop;
    stop2.execute = executeStop;
    return stop2;
  }
  function evaluateGuard(guard, context, event, snapshot) {
    const {
      machine
    } = snapshot;
    const isInline = typeof guard === "function";
    const resolved = isInline ? guard : machine.implementations.guards[typeof guard === "string" ? guard : guard.type];
    if (!isInline && !resolved) {
      throw new Error(`Guard '${typeof guard === "string" ? guard : guard.type}' is not implemented.'.`);
    }
    if (typeof resolved !== "function") {
      return evaluateGuard(resolved, context, event, snapshot);
    }
    const guardArgs = {
      context,
      event
    };
    const guardParams = isInline || typeof guard === "string" ? void 0 : "params" in guard ? typeof guard.params === "function" ? guard.params({
      context,
      event
    }) : guard.params : void 0;
    if (!("check" in resolved)) {
      return resolved(guardArgs, guardParams);
    }
    const builtinGuard = resolved;
    return builtinGuard.check(
      snapshot,
      guardArgs,
      resolved
      // this holds all params
    );
  }
  var isAtomicStateNode = (stateNode) => stateNode.type === "atomic" || stateNode.type === "final";
  function getChildren(stateNode) {
    return Object.values(stateNode.states).filter((sn) => sn.type !== "history");
  }
  function getProperAncestors(stateNode, toStateNode) {
    const ancestors = [];
    if (toStateNode === stateNode) {
      return ancestors;
    }
    let m = stateNode.parent;
    while (m && m !== toStateNode) {
      ancestors.push(m);
      m = m.parent;
    }
    return ancestors;
  }
  function getAllStateNodes(stateNodes) {
    const nodeSet = new Set(stateNodes);
    const adjList = getAdjList(nodeSet);
    for (const s of nodeSet) {
      if (s.type === "compound" && (!adjList.get(s) || !adjList.get(s).length)) {
        getInitialStateNodesWithTheirAncestors(s).forEach((sn) => nodeSet.add(sn));
      } else {
        if (s.type === "parallel") {
          for (const child of getChildren(s)) {
            if (child.type === "history") {
              continue;
            }
            if (!nodeSet.has(child)) {
              const initialStates = getInitialStateNodesWithTheirAncestors(child);
              for (const initialStateNode of initialStates) {
                nodeSet.add(initialStateNode);
              }
            }
          }
        }
      }
    }
    for (const s of nodeSet) {
      let m = s.parent;
      while (m) {
        nodeSet.add(m);
        m = m.parent;
      }
    }
    return nodeSet;
  }
  function getValueFromAdj(baseNode, adjList) {
    const childStateNodes = adjList.get(baseNode);
    if (!childStateNodes) {
      return {};
    }
    if (baseNode.type === "compound") {
      const childStateNode = childStateNodes[0];
      if (childStateNode) {
        if (isAtomicStateNode(childStateNode)) {
          return childStateNode.key;
        }
      } else {
        return {};
      }
    }
    const stateValue = {};
    for (const childStateNode of childStateNodes) {
      stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
    }
    return stateValue;
  }
  function getAdjList(stateNodes) {
    const adjList = /* @__PURE__ */ new Map();
    for (const s of stateNodes) {
      if (!adjList.has(s)) {
        adjList.set(s, []);
      }
      if (s.parent) {
        if (!adjList.has(s.parent)) {
          adjList.set(s.parent, []);
        }
        adjList.get(s.parent).push(s);
      }
    }
    return adjList;
  }
  function getStateValue(rootNode, stateNodes) {
    const config = getAllStateNodes(stateNodes);
    return getValueFromAdj(rootNode, getAdjList(config));
  }
  function isInFinalState(stateNodeSet, stateNode) {
    if (stateNode.type === "compound") {
      return getChildren(stateNode).some((s) => s.type === "final" && stateNodeSet.has(s));
    }
    if (stateNode.type === "parallel") {
      return getChildren(stateNode).every((sn) => isInFinalState(stateNodeSet, sn));
    }
    return stateNode.type === "final";
  }
  var isStateId = (str) => str[0] === STATE_IDENTIFIER;
  function getCandidates(stateNode, receivedEventType) {
    const candidates = stateNode.transitions.get(receivedEventType) || [...stateNode.transitions.keys()].filter((eventDescriptor) => {
      if (eventDescriptor === WILDCARD) {
        return true;
      }
      if (!eventDescriptor.endsWith(".*")) {
        return false;
      }
      const partialEventTokens = eventDescriptor.split(".");
      const eventTokens = receivedEventType.split(".");
      for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
        const partialEventToken = partialEventTokens[tokenIndex];
        const eventToken = eventTokens[tokenIndex];
        if (partialEventToken === "*") {
          const isLastToken = tokenIndex === partialEventTokens.length - 1;
          return isLastToken;
        }
        if (partialEventToken !== eventToken) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => b.length - a.length).flatMap((key) => stateNode.transitions.get(key));
    return candidates;
  }
  function getDelayedTransitions(stateNode) {
    const afterConfig = stateNode.config.after;
    if (!afterConfig) {
      return [];
    }
    const mutateEntryExit = (delay) => {
      const afterEvent = createAfterEvent(delay, stateNode.id);
      const eventType = afterEvent.type;
      stateNode.entry.push(raise(afterEvent, {
        id: eventType,
        delay
      }));
      stateNode.exit.push(cancel(eventType));
      return eventType;
    };
    const delayedTransitions = Object.keys(afterConfig).flatMap((delay) => {
      const configTransition = afterConfig[delay];
      const resolvedTransition = typeof configTransition === "string" ? {
        target: configTransition
      } : configTransition;
      const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
      const eventType = mutateEntryExit(resolvedDelay);
      return toArray(resolvedTransition).map((transition) => ({
        ...transition,
        event: eventType,
        delay: resolvedDelay
      }));
    });
    return delayedTransitions.map((delayedTransition) => {
      const {
        delay
      } = delayedTransition;
      return {
        ...formatTransition(stateNode, delayedTransition.event, delayedTransition),
        delay
      };
    });
  }
  function formatTransition(stateNode, descriptor, transitionConfig) {
    const normalizedTarget = normalizeTarget(transitionConfig.target);
    const reenter = transitionConfig.reenter ?? false;
    const target = resolveTarget(stateNode, normalizedTarget);
    const transition = {
      ...transitionConfig,
      actions: toArray(transitionConfig.actions),
      guard: transitionConfig.guard,
      target,
      source: stateNode,
      reenter,
      eventType: descriptor,
      toJSON: () => ({
        ...transition,
        source: `#${stateNode.id}`,
        target: target ? target.map((t) => `#${t.id}`) : void 0
      })
    };
    return transition;
  }
  function formatTransitions(stateNode) {
    const transitions = /* @__PURE__ */ new Map();
    if (stateNode.config.on) {
      for (const descriptor of Object.keys(stateNode.config.on)) {
        if (descriptor === NULL_EVENT) {
          throw new Error('Null events ("") cannot be specified as a transition key. Use `always: { ... }` instead.');
        }
        const transitionsConfig = stateNode.config.on[descriptor];
        transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map((t) => formatTransition(stateNode, descriptor, t)));
      }
    }
    if (stateNode.config.onDone) {
      const descriptor = `xstate.done.state.${stateNode.id}`;
      transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
    }
    for (const invokeDef of stateNode.invoke) {
      if (invokeDef.onDone) {
        const descriptor = `xstate.done.actor.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
      }
      if (invokeDef.onError) {
        const descriptor = `xstate.error.actor.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map((t) => formatTransition(stateNode, descriptor, t)));
      }
      if (invokeDef.onSnapshot) {
        const descriptor = `xstate.snapshot.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map((t) => formatTransition(stateNode, descriptor, t)));
      }
    }
    for (const delayedTransition of stateNode.after) {
      let existing = transitions.get(delayedTransition.eventType);
      if (!existing) {
        existing = [];
        transitions.set(delayedTransition.eventType, existing);
      }
      existing.push(delayedTransition);
    }
    return transitions;
  }
  function formatInitialTransition(stateNode, _target) {
    const resolvedTarget = typeof _target === "string" ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : void 0;
    if (!resolvedTarget && _target) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        `Initial state node "${_target}" not found on parent state node #${stateNode.id}`
      );
    }
    const transition = {
      source: stateNode,
      actions: !_target || typeof _target === "string" ? [] : toArray(_target.actions),
      eventType: null,
      reenter: false,
      target: resolvedTarget ? [resolvedTarget] : [],
      toJSON: () => ({
        ...transition,
        source: `#${stateNode.id}`,
        target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
      })
    };
    return transition;
  }
  function resolveTarget(stateNode, targets) {
    if (targets === void 0) {
      return void 0;
    }
    return targets.map((target) => {
      if (typeof target !== "string") {
        return target;
      }
      if (isStateId(target)) {
        return stateNode.machine.getStateNodeById(target);
      }
      const isInternalTarget = target[0] === STATE_DELIMITER;
      if (isInternalTarget && !stateNode.parent) {
        return getStateNodeByPath(stateNode, target.slice(1));
      }
      const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
      if (stateNode.parent) {
        try {
          const targetStateNode = getStateNodeByPath(stateNode.parent, resolvedTarget);
          return targetStateNode;
        } catch (err) {
          throw new Error(`Invalid transition definition for state node '${stateNode.id}':
${err.message}`);
        }
      } else {
        throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
      }
    });
  }
  function resolveHistoryDefaultTransition(stateNode) {
    const normalizedTarget = normalizeTarget(stateNode.config.target);
    if (!normalizedTarget) {
      return stateNode.parent.initial;
    }
    return {
      target: normalizedTarget.map((t) => typeof t === "string" ? getStateNodeByPath(stateNode.parent, t) : t)
    };
  }
  function isHistoryNode(stateNode) {
    return stateNode.type === "history";
  }
  function getInitialStateNodesWithTheirAncestors(stateNode) {
    const states = getInitialStateNodes(stateNode);
    for (const initialState of states) {
      for (const ancestor of getProperAncestors(initialState, stateNode)) {
        states.add(ancestor);
      }
    }
    return states;
  }
  function getInitialStateNodes(stateNode) {
    const set = /* @__PURE__ */ new Set();
    function iter(descStateNode) {
      if (set.has(descStateNode)) {
        return;
      }
      set.add(descStateNode);
      if (descStateNode.type === "compound") {
        iter(descStateNode.initial.target[0]);
      } else if (descStateNode.type === "parallel") {
        for (const child of getChildren(descStateNode)) {
          iter(child);
        }
      }
    }
    iter(stateNode);
    return set;
  }
  function getStateNode(stateNode, stateKey) {
    if (isStateId(stateKey)) {
      return stateNode.machine.getStateNodeById(stateKey);
    }
    if (!stateNode.states) {
      throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
    }
    const result = stateNode.states[stateKey];
    if (!result) {
      throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
    }
    return result;
  }
  function getStateNodeByPath(stateNode, statePath) {
    if (typeof statePath === "string" && isStateId(statePath)) {
      try {
        return stateNode.machine.getStateNodeById(statePath);
      } catch {
      }
    }
    const arrayStatePath = toStatePath(statePath).slice();
    let currentStateNode = stateNode;
    while (arrayStatePath.length) {
      const key = arrayStatePath.shift();
      if (!key.length) {
        break;
      }
      currentStateNode = getStateNode(currentStateNode, key);
    }
    return currentStateNode;
  }
  function getStateNodes(stateNode, stateValue) {
    if (typeof stateValue === "string") {
      const childStateNode = stateNode.states[stateValue];
      if (!childStateNode) {
        throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
      }
      return [stateNode, childStateNode];
    }
    const childStateKeys = Object.keys(stateValue);
    const childStateNodes = childStateKeys.map((subStateKey) => getStateNode(stateNode, subStateKey)).filter(Boolean);
    return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
      const subStateNode = getStateNode(stateNode, subStateKey);
      if (!subStateNode) {
        return allSubStateNodes;
      }
      const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
      return allSubStateNodes.concat(subStateNodes);
    }, []));
  }
  function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
    const childStateNode = getStateNode(stateNode, stateValue);
    const next = childStateNode.next(snapshot, event);
    if (!next || !next.length) {
      return stateNode.next(snapshot, event);
    }
    return next;
  }
  function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
    const subStateKeys = Object.keys(stateValue);
    const childStateNode = getStateNode(stateNode, subStateKeys[0]);
    const next = transitionNode(childStateNode, stateValue[subStateKeys[0]], snapshot, event);
    if (!next || !next.length) {
      return stateNode.next(snapshot, event);
    }
    return next;
  }
  function transitionParallelNode(stateNode, stateValue, snapshot, event) {
    const allInnerTransitions = [];
    for (const subStateKey of Object.keys(stateValue)) {
      const subStateValue = stateValue[subStateKey];
      if (!subStateValue) {
        continue;
      }
      const subStateNode = getStateNode(stateNode, subStateKey);
      const innerTransitions = transitionNode(subStateNode, subStateValue, snapshot, event);
      if (innerTransitions) {
        allInnerTransitions.push(...innerTransitions);
      }
    }
    if (!allInnerTransitions.length) {
      return stateNode.next(snapshot, event);
    }
    return allInnerTransitions;
  }
  function transitionNode(stateNode, stateValue, snapshot, event) {
    if (typeof stateValue === "string") {
      return transitionAtomicNode(stateNode, stateValue, snapshot, event);
    }
    if (Object.keys(stateValue).length === 1) {
      return transitionCompoundNode(stateNode, stateValue, snapshot, event);
    }
    return transitionParallelNode(stateNode, stateValue, snapshot, event);
  }
  function getHistoryNodes(stateNode) {
    return Object.keys(stateNode.states).map((key) => stateNode.states[key]).filter((sn) => sn.type === "history");
  }
  function isDescendant(childStateNode, parentStateNode) {
    let marker = childStateNode;
    while (marker.parent && marker.parent !== parentStateNode) {
      marker = marker.parent;
    }
    return marker.parent === parentStateNode;
  }
  function hasIntersection(s1, s2) {
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    for (const item of set1) {
      if (set2.has(item)) {
        return true;
      }
    }
    for (const item of set2) {
      if (set1.has(item)) {
        return true;
      }
    }
    return false;
  }
  function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
    const filteredTransitions = /* @__PURE__ */ new Set();
    for (const t1 of enabledTransitions) {
      let t1Preempted = false;
      const transitionsToRemove = /* @__PURE__ */ new Set();
      for (const t2 of filteredTransitions) {
        if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
          if (isDescendant(t1.source, t2.source)) {
            transitionsToRemove.add(t2);
          } else {
            t1Preempted = true;
            break;
          }
        }
      }
      if (!t1Preempted) {
        for (const t3 of transitionsToRemove) {
          filteredTransitions.delete(t3);
        }
        filteredTransitions.add(t1);
      }
    }
    return Array.from(filteredTransitions);
  }
  function findLeastCommonAncestor(stateNodes) {
    const [head, ...tail] = stateNodes;
    for (const ancestor of getProperAncestors(head, void 0)) {
      if (tail.every((sn) => isDescendant(sn, ancestor))) {
        return ancestor;
      }
    }
  }
  function getEffectiveTargetStates(transition, historyValue) {
    if (!transition.target) {
      return [];
    }
    const targets = /* @__PURE__ */ new Set();
    for (const targetNode of transition.target) {
      if (isHistoryNode(targetNode)) {
        if (historyValue[targetNode.id]) {
          for (const node of historyValue[targetNode.id]) {
            targets.add(node);
          }
        } else {
          for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) {
            targets.add(node);
          }
        }
      } else {
        targets.add(targetNode);
      }
    }
    return [...targets];
  }
  function getTransitionDomain(transition, historyValue) {
    const targetStates = getEffectiveTargetStates(transition, historyValue);
    if (!targetStates) {
      return;
    }
    if (!transition.reenter && targetStates.every((target) => target === transition.source || isDescendant(target, transition.source))) {
      return transition.source;
    }
    const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
    if (lca) {
      return lca;
    }
    if (transition.reenter) {
      return;
    }
    return transition.source.machine.root;
  }
  function computeExitSet(transitions, stateNodeSet, historyValue) {
    const statesToExit = /* @__PURE__ */ new Set();
    for (const t of transitions) {
      if (t.target?.length) {
        const domain = getTransitionDomain(t, historyValue);
        if (t.reenter && t.source === domain) {
          statesToExit.add(domain);
        }
        for (const stateNode of stateNodeSet) {
          if (isDescendant(stateNode, domain)) {
            statesToExit.add(stateNode);
          }
        }
      }
    }
    return [...statesToExit];
  }
  function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
    if (prevStateNodes.length !== nextStateNodeSet.size) {
      return false;
    }
    for (const node of prevStateNodes) {
      if (!nextStateNodeSet.has(node)) {
        return false;
      }
    }
    return true;
  }
  function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
    if (!transitions.length) {
      return currentSnapshot;
    }
    const mutStateNodeSet = new Set(currentSnapshot._nodes);
    let historyValue = currentSnapshot.historyValue;
    const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
    let nextState = currentSnapshot;
    if (!isInitial) {
      [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue, actorScope.actionExecutor);
    }
    nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap((t) => t.actions), internalQueue, void 0);
    nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
    const nextStateNodes = [...mutStateNodeSet];
    if (nextState.status === "done") {
      nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a, b) => b.order - a.order).flatMap((state) => state.exit), internalQueue, void 0);
    }
    try {
      if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) {
        return nextState;
      }
      return cloneMachineSnapshot(nextState, {
        _nodes: nextStateNodes,
        historyValue
      });
    } catch (e) {
      throw e;
    }
  }
  function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
    if (rootNode.output === void 0) {
      return;
    }
    const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== void 0 && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : void 0);
    return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
  }
  function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
    let nextSnapshot = currentSnapshot;
    const statesToEnter = /* @__PURE__ */ new Set();
    const statesForDefaultEntry = /* @__PURE__ */ new Set();
    computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);
    if (isInitial) {
      statesForDefaultEntry.add(currentSnapshot.machine.root);
    }
    const completedNodes = /* @__PURE__ */ new Set();
    for (const stateNodeToEnter of [...statesToEnter].sort((a, b) => a.order - b.order)) {
      mutStateNodeSet.add(stateNodeToEnter);
      const actions = [];
      actions.push(...stateNodeToEnter.entry);
      for (const invokeDef of stateNodeToEnter.invoke) {
        actions.push(spawnChild(invokeDef.src, {
          ...invokeDef,
          syncSnapshot: !!invokeDef.onSnapshot
        }));
      }
      if (statesForDefaultEntry.has(stateNodeToEnter)) {
        const initialActions = stateNodeToEnter.initial.actions;
        actions.push(...initialActions);
      }
      nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions, internalQueue, stateNodeToEnter.invoke.map((invokeDef) => invokeDef.id));
      if (stateNodeToEnter.type === "final") {
        const parent = stateNodeToEnter.parent;
        let ancestorMarker = parent?.type === "parallel" ? parent : parent?.parent;
        let rootCompletionNode = ancestorMarker || stateNodeToEnter;
        if (parent?.type === "compound") {
          internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== void 0 ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : void 0));
        }
        while (ancestorMarker?.type === "parallel" && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
          completedNodes.add(ancestorMarker);
          internalQueue.push(createDoneStateEvent(ancestorMarker.id));
          rootCompletionNode = ancestorMarker;
          ancestorMarker = ancestorMarker.parent;
        }
        if (ancestorMarker) {
          continue;
        }
        nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
          status: "done",
          output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
        });
      }
    }
    return nextSnapshot;
  }
  function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
    for (const t of transitions) {
      const domain = getTransitionDomain(t, historyValue);
      for (const s of t.target || []) {
        if (!isHistoryNode(s) && // if the target is different than the source then it will *definitely* be entered
        (t.source !== s || // we know that the domain can't lie within the source
        // if it's different than the source then it's outside of it and it means that the target has to be entered as well
        t.source !== domain || // reentering transitions always enter the target, even if it's the source itself
        t.reenter)) {
          statesToEnter.add(s);
          statesForDefaultEntry.add(s);
        }
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      const targetStates = getEffectiveTargetStates(t, historyValue);
      for (const s of targetStates) {
        const ancestors = getProperAncestors(s, domain);
        if (domain?.type === "parallel") {
          ancestors.push(domain);
        }
        addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t.source.parent && t.reenter ? void 0 : domain);
      }
    }
  }
  function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
    if (isHistoryNode(stateNode)) {
      if (historyValue[stateNode.id]) {
        const historyStateNodes = historyValue[stateNode.id];
        for (const s of historyStateNodes) {
          statesToEnter.add(s);
          addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
        }
        for (const s of historyStateNodes) {
          addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
        }
      } else {
        const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
        for (const s of historyDefaultTransition.target) {
          statesToEnter.add(s);
          if (historyDefaultTransition === stateNode.parent?.initial) {
            statesForDefaultEntry.add(stateNode.parent);
          }
          addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
        }
        for (const s of historyDefaultTransition.target) {
          addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
        }
      }
    } else {
      if (stateNode.type === "compound") {
        const [initialState] = stateNode.initial.target;
        if (!isHistoryNode(initialState)) {
          statesToEnter.add(initialState);
          statesForDefaultEntry.add(initialState);
        }
        addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
        addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
      } else {
        if (stateNode.type === "parallel") {
          for (const child of getChildren(stateNode).filter((sn) => !isHistoryNode(sn))) {
            if (![...statesToEnter].some((s) => isDescendant(s, child))) {
              if (!isHistoryNode(child)) {
                statesToEnter.add(child);
                statesForDefaultEntry.add(child);
              }
              addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
            }
          }
        }
      }
    }
  }
  function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
    for (const anc of ancestors) {
      if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) {
        statesToEnter.add(anc);
      }
      if (anc.type === "parallel") {
        for (const child of getChildren(anc).filter((sn) => !isHistoryNode(sn))) {
          if (![...statesToEnter].some((s) => isDescendant(s, child))) {
            statesToEnter.add(child);
            addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
          }
        }
      }
    }
  }
  function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
    addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
  }
  function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
    let nextSnapshot = currentSnapshot;
    const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
    statesToExit.sort((a, b) => b.order - a.order);
    let changedHistory;
    for (const exitStateNode of statesToExit) {
      for (const historyNode of getHistoryNodes(exitStateNode)) {
        let predicate;
        if (historyNode.history === "deep") {
          predicate = (sn) => isAtomicStateNode(sn) && isDescendant(sn, exitStateNode);
        } else {
          predicate = (sn) => {
            return sn.parent === exitStateNode;
          };
        }
        changedHistory ??= {
          ...historyValue
        };
        changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
      }
    }
    for (const s of statesToExit) {
      nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s.exit, ...s.invoke.map((def) => stopChild(def.id))], internalQueue, void 0);
      mutStateNodeSet.delete(s);
    }
    return [nextSnapshot, changedHistory || historyValue];
  }
  function getAction(machine, actionType) {
    return machine.implementations.actions[actionType];
  }
  function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, extra, retries) {
    const {
      machine
    } = currentSnapshot;
    let intermediateSnapshot = currentSnapshot;
    for (const action of actions) {
      const isInline = typeof action === "function";
      const resolvedAction = isInline ? action : (
        // the existing type of `.actions` assumes non-nullable `TExpressionAction`
        // it's fine to cast this here to get a common type and lack of errors in the rest of the code
        // our logic below makes sure that we call those 2 "variants" correctly
        getAction(machine, typeof action === "string" ? action : action.type)
      );
      const actionArgs = {
        context: intermediateSnapshot.context,
        event,
        self: actorScope.self,
        system: actorScope.system
      };
      const actionParams = isInline || typeof action === "string" ? void 0 : "params" in action ? typeof action.params === "function" ? action.params({
        context: intermediateSnapshot.context,
        event
      }) : action.params : void 0;
      if (!resolvedAction || !("resolve" in resolvedAction)) {
        actorScope.actionExecutor({
          type: typeof action === "string" ? action : typeof action === "object" ? action.type : action.name || "(anonymous)",
          info: actionArgs,
          params: actionParams,
          exec: resolvedAction
        });
        continue;
      }
      const builtinAction = resolvedAction;
      const [nextState, params, actions2] = builtinAction.resolve(
        actorScope,
        intermediateSnapshot,
        actionArgs,
        actionParams,
        resolvedAction,
        // this holds all params
        extra
      );
      intermediateSnapshot = nextState;
      if ("retryResolve" in builtinAction) {
        retries?.push([builtinAction, params]);
      }
      if ("execute" in builtinAction) {
        actorScope.actionExecutor({
          type: builtinAction.type,
          info: actionArgs,
          params,
          exec: builtinAction.execute.bind(null, actorScope, params)
        });
      }
      if (actions2) {
        intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions2, extra, retries);
      }
    }
    return intermediateSnapshot;
  }
  function resolveActionsAndContext(currentSnapshot, event, actorScope, actions, internalQueue, deferredActorIds) {
    const retries = deferredActorIds ? [] : void 0;
    const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, {
      internalQueue,
      deferredActorIds
    }, retries);
    retries?.forEach(([builtinAction, params]) => {
      builtinAction.retryResolve(actorScope, nextState, params);
    });
    return nextState;
  }
  function macrostep(snapshot, event, actorScope, internalQueue) {
    let nextSnapshot = snapshot;
    const microstates = [];
    function addMicrostate(microstate, event2, transitions) {
      actorScope.system._sendInspectionEvent({
        type: "@xstate.microstep",
        actorRef: actorScope.self,
        event: event2,
        snapshot: microstate,
        _transitions: transitions
      });
      microstates.push(microstate);
    }
    if (event.type === XSTATE_STOP) {
      nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), {
        status: "stopped"
      });
      addMicrostate(nextSnapshot, event, []);
      return {
        snapshot: nextSnapshot,
        microstates
      };
    }
    let nextEvent = event;
    if (nextEvent.type !== XSTATE_INIT) {
      const currentEvent = nextEvent;
      const isErr = isErrorActorEvent(currentEvent);
      const transitions = selectTransitions(currentEvent, nextSnapshot);
      if (isErr && !transitions.length) {
        nextSnapshot = cloneMachineSnapshot(snapshot, {
          status: "error",
          error: currentEvent.error
        });
        addMicrostate(nextSnapshot, currentEvent, []);
        return {
          snapshot: nextSnapshot,
          microstates
        };
      }
      nextSnapshot = microstep(
        transitions,
        snapshot,
        actorScope,
        nextEvent,
        false,
        // isInitial
        internalQueue
      );
      addMicrostate(nextSnapshot, currentEvent, transitions);
    }
    let shouldSelectEventlessTransitions = true;
    while (nextSnapshot.status === "active") {
      let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];
      const previousState = enabledTransitions.length ? nextSnapshot : void 0;
      if (!enabledTransitions.length) {
        if (!internalQueue.length) {
          break;
        }
        nextEvent = internalQueue.shift();
        enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
      }
      nextSnapshot = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
      shouldSelectEventlessTransitions = nextSnapshot !== previousState;
      addMicrostate(nextSnapshot, nextEvent, enabledTransitions);
    }
    if (nextSnapshot.status !== "active") {
      stopChildren(nextSnapshot, nextEvent, actorScope);
    }
    return {
      snapshot: nextSnapshot,
      microstates
    };
  }
  function stopChildren(nextState, event, actorScope) {
    return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map((child) => stopChild(child)), [], void 0);
  }
  function selectTransitions(event, nextState) {
    return nextState.machine.getTransitionData(nextState, event);
  }
  function selectEventlessTransitions(nextState, event) {
    const enabledTransitionSet = /* @__PURE__ */ new Set();
    const atomicStates = nextState._nodes.filter(isAtomicStateNode);
    for (const stateNode of atomicStates) {
      loop: for (const s of [stateNode].concat(getProperAncestors(stateNode, void 0))) {
        if (!s.always) {
          continue;
        }
        for (const transition of s.always) {
          if (transition.guard === void 0 || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
            enabledTransitionSet.add(transition);
            break loop;
          }
        }
      }
    }
    return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
  }
  function resolveStateValue(rootNode, stateValue) {
    const allStateNodes = getAllStateNodes(getStateNodes(rootNode, stateValue));
    return getStateValue(rootNode, [...allStateNodes]);
  }
  function isMachineSnapshot(value2) {
    return !!value2 && typeof value2 === "object" && "machine" in value2 && "value" in value2;
  }
  var machineSnapshotMatches = function matches(testValue) {
    return matchesState(testValue, this.value);
  };
  var machineSnapshotHasTag = function hasTag(tag) {
    return this.tags.has(tag);
  };
  var machineSnapshotCan = function can(event) {
    const transitionData = this.machine.getTransitionData(this, event);
    return !!transitionData?.length && // Check that at least one transition is not forbidden
    transitionData.some((t) => t.target !== void 0 || t.actions.length);
  };
  var machineSnapshotToJSON = function toJSON() {
    const {
      _nodes: nodes,
      tags,
      machine,
      getMeta: getMeta2,
      toJSON: toJSON2,
      can: can2,
      hasTag: hasTag2,
      matches: matches2,
      ...jsonValues
    } = this;
    return {
      ...jsonValues,
      tags: Array.from(tags)
    };
  };
  var machineSnapshotGetMeta = function getMeta() {
    return this._nodes.reduce((acc, stateNode) => {
      if (stateNode.meta !== void 0) {
        acc[stateNode.id] = stateNode.meta;
      }
      return acc;
    }, {});
  };
  function createMachineSnapshot(config, machine) {
    return {
      status: config.status,
      output: config.output,
      error: config.error,
      machine,
      context: config.context,
      _nodes: config._nodes,
      value: getStateValue(machine.root, config._nodes),
      tags: new Set(config._nodes.flatMap((sn) => sn.tags)),
      children: config.children,
      historyValue: config.historyValue || {},
      matches: machineSnapshotMatches,
      hasTag: machineSnapshotHasTag,
      can: machineSnapshotCan,
      getMeta: machineSnapshotGetMeta,
      toJSON: machineSnapshotToJSON
    };
  }
  function cloneMachineSnapshot(snapshot, config = {}) {
    return createMachineSnapshot({
      ...snapshot,
      ...config
    }, snapshot.machine);
  }
  function getPersistedSnapshot(snapshot, options) {
    const {
      _nodes: nodes,
      tags,
      machine,
      children,
      context,
      can: can2,
      hasTag: hasTag2,
      matches: matches2,
      getMeta: getMeta2,
      toJSON: toJSON2,
      ...jsonValues
    } = snapshot;
    const childrenJson = {};
    for (const id in children) {
      const child = children[id];
      childrenJson[id] = {
        snapshot: child.getPersistedSnapshot(options),
        src: child.src,
        systemId: child._systemId,
        syncSnapshot: child._syncSnapshot
      };
    }
    const persisted = {
      ...jsonValues,
      context: persistContext(context),
      children: childrenJson
    };
    return persisted;
  }
  function persistContext(contextPart) {
    let copy;
    for (const key in contextPart) {
      const value2 = contextPart[key];
      if (value2 && typeof value2 === "object") {
        if ("sessionId" in value2 && "send" in value2 && "ref" in value2) {
          copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
            ...contextPart
          };
          copy[key] = {
            xstate$$type: $$ACTOR_TYPE,
            id: value2.id
          };
        } else {
          const result = persistContext(value2);
          if (result !== value2) {
            copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
              ...contextPart
            };
            copy[key] = result;
          }
        }
      }
    }
    return copy ?? contextPart;
  }
  function resolveRaise(_, snapshot, args, actionParams, {
    event: eventOrExpr,
    id,
    delay
  }, {
    internalQueue
  }) {
    const delaysMap = snapshot.machine.implementations.delays;
    if (typeof eventOrExpr === "string") {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`
      );
    }
    const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
    let resolvedDelay;
    if (typeof delay === "string") {
      const configDelay = delaysMap && delaysMap[delay];
      resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
    } else {
      resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
    }
    if (typeof resolvedDelay !== "number") {
      internalQueue.push(resolvedEvent);
    }
    return [snapshot, {
      event: resolvedEvent,
      id,
      delay: resolvedDelay
    }, void 0];
  }
  function executeRaise(actorScope, params) {
    const {
      event,
      delay,
      id
    } = params;
    if (typeof delay === "number") {
      actorScope.defer(() => {
        const self2 = actorScope.self;
        actorScope.system.scheduler.schedule(self2, self2, event, delay, id);
      });
      return;
    }
  }
  function raise(eventOrExpr, options) {
    function raise2(_args, _params) {
    }
    raise2.type = "xstate.raise";
    raise2.event = eventOrExpr;
    raise2.id = options?.id;
    raise2.delay = options?.delay;
    raise2.resolve = resolveRaise;
    raise2.execute = executeRaise;
    return raise2;
  }

  // ../../node_modules/.pnpm/xstate@5.19.2/node_modules/xstate/actors/dist/xstate-actors.esm.js
  function fromTransition(transition, initialContext) {
    return {
      config: transition,
      transition: (snapshot, event, actorScope) => {
        return {
          ...snapshot,
          context: transition(snapshot.context, event, actorScope)
        };
      },
      getInitialSnapshot: (_, input) => {
        return {
          status: "active",
          output: void 0,
          error: void 0,
          context: typeof initialContext === "function" ? initialContext({
            input
          }) : initialContext
        };
      },
      getPersistedSnapshot: (snapshot) => snapshot,
      restoreSnapshot: (snapshot) => snapshot
    };
  }
  var XSTATE_PROMISE_RESOLVE = "xstate.promise.resolve";
  var XSTATE_PROMISE_REJECT = "xstate.promise.reject";
  var controllerMap = /* @__PURE__ */ new WeakMap();
  function fromPromise(promiseCreator) {
    const logic = {
      config: promiseCreator,
      transition: (state, event, scope) => {
        if (state.status !== "active") {
          return state;
        }
        switch (event.type) {
          case XSTATE_PROMISE_RESOLVE: {
            const resolvedValue = event.data;
            return {
              ...state,
              status: "done",
              output: resolvedValue,
              input: void 0
            };
          }
          case XSTATE_PROMISE_REJECT:
            return {
              ...state,
              status: "error",
              error: event.data,
              input: void 0
            };
          case XSTATE_STOP: {
            controllerMap.get(scope.self)?.abort();
            return {
              ...state,
              status: "stopped",
              input: void 0
            };
          }
          default:
            return state;
        }
      },
      start: (state, {
        self: self2,
        system,
        emit: emit2
      }) => {
        if (state.status !== "active") {
          return;
        }
        const controller = new AbortController();
        controllerMap.set(self2, controller);
        const resolvedPromise = Promise.resolve(promiseCreator({
          input: state.input,
          system,
          self: self2,
          signal: controller.signal,
          emit: emit2
        }));
        resolvedPromise.then((response) => {
          if (self2.getSnapshot().status !== "active") {
            return;
          }
          controllerMap.delete(self2);
          system._relay(self2, self2, {
            type: XSTATE_PROMISE_RESOLVE,
            data: response
          });
        }, (errorData) => {
          if (self2.getSnapshot().status !== "active") {
            return;
          }
          controllerMap.delete(self2);
          system._relay(self2, self2, {
            type: XSTATE_PROMISE_REJECT,
            data: errorData
          });
        });
      },
      getInitialSnapshot: (_, input) => {
        return {
          status: "active",
          output: void 0,
          error: void 0,
          input
        };
      },
      getPersistedSnapshot: (snapshot) => snapshot,
      restoreSnapshot: (snapshot) => snapshot
    };
    return logic;
  }
  var emptyLogic = fromTransition((_) => void 0, void 0);

  // ../../node_modules/.pnpm/xstate@5.19.2/node_modules/xstate/dist/log-3d9d72a9.esm.js
  function createSpawner(actorScope, {
    machine,
    context
  }, event, spawnedChildren) {
    const spawn = (src, options) => {
      if (typeof src === "string") {
        const logic = resolveReferencedActor(machine, src);
        if (!logic) {
          throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
        }
        const actorRef = createActor(logic, {
          id: options?.id,
          parent: actorScope.self,
          syncSnapshot: options?.syncSnapshot,
          input: typeof options?.input === "function" ? options.input({
            context,
            event,
            self: actorScope.self
          }) : options?.input,
          src,
          systemId: options?.systemId
        });
        spawnedChildren[actorRef.id] = actorRef;
        return actorRef;
      } else {
        const actorRef = createActor(src, {
          id: options?.id,
          parent: actorScope.self,
          syncSnapshot: options?.syncSnapshot,
          input: options?.input,
          src,
          systemId: options?.systemId
        });
        return actorRef;
      }
    };
    return (src, options) => {
      const actorRef = spawn(src, options);
      spawnedChildren[actorRef.id] = actorRef;
      actorScope.defer(() => {
        if (actorRef._processingStatus === ProcessingStatus.Stopped) {
          return;
        }
        actorRef.start();
      });
      return actorRef;
    };
  }
  function resolveAssign(actorScope, snapshot, actionArgs, actionParams, {
    assignment
  }) {
    if (!snapshot.context) {
      throw new Error("Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.");
    }
    const spawnedChildren = {};
    const assignArgs = {
      context: snapshot.context,
      event: actionArgs.event,
      spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
      self: actorScope.self,
      system: actorScope.system
    };
    let partialUpdate = {};
    if (typeof assignment === "function") {
      partialUpdate = assignment(assignArgs, actionParams);
    } else {
      for (const key of Object.keys(assignment)) {
        const propAssignment = assignment[key];
        partialUpdate[key] = typeof propAssignment === "function" ? propAssignment(assignArgs, actionParams) : propAssignment;
      }
    }
    const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
    return [cloneMachineSnapshot(snapshot, {
      context: updatedContext,
      children: Object.keys(spawnedChildren).length ? {
        ...snapshot.children,
        ...spawnedChildren
      } : snapshot.children
    }), void 0, void 0];
  }
  function assign(assignment) {
    function assign2(_args, _params) {
    }
    assign2.type = "xstate.assign";
    assign2.assignment = assignment;
    assign2.resolve = resolveAssign;
    return assign2;
  }

  // ../../node_modules/.pnpm/xstate@5.19.2/node_modules/xstate/dist/xstate.esm.js
  var cache = /* @__PURE__ */ new WeakMap();
  function memo(object, key, fn) {
    let memoizedData = cache.get(object);
    if (!memoizedData) {
      memoizedData = {
        [key]: fn()
      };
      cache.set(object, memoizedData);
    } else if (!(key in memoizedData)) {
      memoizedData[key] = fn();
    }
    return memoizedData[key];
  }
  var EMPTY_OBJECT = {};
  var toSerializableAction = (action) => {
    if (typeof action === "string") {
      return {
        type: action
      };
    }
    if (typeof action === "function") {
      if ("resolve" in action) {
        return {
          type: action.type
        };
      }
      return {
        type: action.name
      };
    }
    return action;
  };
  var StateNode = class _StateNode {
    constructor(config, options) {
      this.config = config;
      this.key = void 0;
      this.id = void 0;
      this.type = void 0;
      this.path = void 0;
      this.states = void 0;
      this.history = void 0;
      this.entry = void 0;
      this.exit = void 0;
      this.parent = void 0;
      this.machine = void 0;
      this.meta = void 0;
      this.output = void 0;
      this.order = -1;
      this.description = void 0;
      this.tags = [];
      this.transitions = void 0;
      this.always = void 0;
      this.parent = options._parent;
      this.key = options._key;
      this.machine = options._machine;
      this.path = this.parent ? this.parent.path.concat(this.key) : [];
      this.id = this.config.id || [this.machine.id, ...this.path].join(STATE_DELIMITER);
      this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? "compound" : this.config.history ? "history" : "atomic");
      this.description = this.config.description;
      this.order = this.machine.idMap.size;
      this.machine.idMap.set(this.id, this);
      this.states = this.config.states ? mapValues(this.config.states, (stateConfig, key) => {
        const stateNode = new _StateNode(stateConfig, {
          _parent: this,
          _key: key,
          _machine: this.machine
        });
        return stateNode;
      }) : EMPTY_OBJECT;
      if (this.type === "compound" && !this.config.initial) {
        throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
      }
      this.history = this.config.history === true ? "shallow" : this.config.history || false;
      this.entry = toArray(this.config.entry).slice();
      this.exit = toArray(this.config.exit).slice();
      this.meta = this.config.meta;
      this.output = this.type === "final" || !this.parent ? this.config.output : void 0;
      this.tags = toArray(config.tags).slice();
    }
    /** @internal */
    _initialize() {
      this.transitions = formatTransitions(this);
      if (this.config.always) {
        this.always = toTransitionConfigArray(this.config.always).map((t) => formatTransition(this, NULL_EVENT, t));
      }
      Object.keys(this.states).forEach((key) => {
        this.states[key]._initialize();
      });
    }
    /** The well-structured state node definition. */
    get definition() {
      return {
        id: this.id,
        key: this.key,
        version: this.machine.version,
        type: this.type,
        initial: this.initial ? {
          target: this.initial.target,
          source: this,
          actions: this.initial.actions.map(toSerializableAction),
          eventType: null,
          reenter: false,
          toJSON: () => ({
            target: this.initial.target.map((t) => `#${t.id}`),
            source: `#${this.id}`,
            actions: this.initial.actions.map(toSerializableAction),
            eventType: null
          })
        } : void 0,
        history: this.history,
        states: mapValues(this.states, (state) => {
          return state.definition;
        }),
        on: this.on,
        transitions: [...this.transitions.values()].flat().map((t) => ({
          ...t,
          actions: t.actions.map(toSerializableAction)
        })),
        entry: this.entry.map(toSerializableAction),
        exit: this.exit.map(toSerializableAction),
        meta: this.meta,
        order: this.order || -1,
        output: this.output,
        invoke: this.invoke,
        description: this.description,
        tags: this.tags
      };
    }
    /** @internal */
    toJSON() {
      return this.definition;
    }
    /** The logic invoked as actors by this state node. */
    get invoke() {
      return memo(this, "invoke", () => toArray(this.config.invoke).map((invokeConfig, i) => {
        const {
          src,
          systemId
        } = invokeConfig;
        const resolvedId = invokeConfig.id ?? createInvokeId(this.id, i);
        const sourceName = typeof src === "string" ? src : `xstate.invoke.${createInvokeId(this.id, i)}`;
        return {
          ...invokeConfig,
          src: sourceName,
          id: resolvedId,
          systemId,
          toJSON() {
            const {
              onDone,
              onError,
              ...invokeDefValues
            } = invokeConfig;
            return {
              ...invokeDefValues,
              type: "xstate.invoke",
              src: sourceName,
              id: resolvedId
            };
          }
        };
      }));
    }
    /** The mapping of events to transitions. */
    get on() {
      return memo(this, "on", () => {
        const transitions = this.transitions;
        return [...transitions].flatMap(([descriptor, t]) => t.map((t2) => [descriptor, t2])).reduce((map, [descriptor, transition]) => {
          map[descriptor] = map[descriptor] || [];
          map[descriptor].push(transition);
          return map;
        }, {});
      });
    }
    get after() {
      return memo(this, "delayedTransitions", () => getDelayedTransitions(this));
    }
    get initial() {
      return memo(this, "initial", () => formatInitialTransition(this, this.config.initial));
    }
    /** @internal */
    next(snapshot, event) {
      const eventType = event.type;
      const actions = [];
      let selectedTransition;
      const candidates = memo(this, `candidates-${eventType}`, () => getCandidates(this, eventType));
      for (const candidate of candidates) {
        const {
          guard
        } = candidate;
        const resolvedContext = snapshot.context;
        let guardPassed = false;
        try {
          guardPassed = !guard || evaluateGuard(guard, resolvedContext, event, snapshot);
        } catch (err) {
          const guardType = typeof guard === "string" ? guard : typeof guard === "object" ? guard.type : void 0;
          throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ""}in transition for event '${eventType}' in state node '${this.id}':
${err.message}`);
        }
        if (guardPassed) {
          actions.push(...candidate.actions);
          selectedTransition = candidate;
          break;
        }
      }
      return selectedTransition ? [selectedTransition] : void 0;
    }
    /** All the event types accepted by this state node and its descendants. */
    get events() {
      return memo(this, "events", () => {
        const {
          states
        } = this;
        const events = new Set(this.ownEvents);
        if (states) {
          for (const stateId of Object.keys(states)) {
            const state = states[stateId];
            if (state.states) {
              for (const event of state.events) {
                events.add(`${event}`);
              }
            }
          }
        }
        return Array.from(events);
      });
    }
    /**
     * All the events that have transitions directly from this state node.
     *
     * Excludes any inert events.
     */
    get ownEvents() {
      const events = new Set([...this.transitions.keys()].filter((descriptor) => {
        return this.transitions.get(descriptor).some((transition) => !(!transition.target && !transition.actions.length && !transition.reenter));
      }));
      return Array.from(events);
    }
  };
  var STATE_IDENTIFIER2 = "#";
  var StateMachine = class _StateMachine {
    constructor(config, implementations) {
      this.config = config;
      this.version = void 0;
      this.schemas = void 0;
      this.implementations = void 0;
      this.__xstatenode = true;
      this.idMap = /* @__PURE__ */ new Map();
      this.root = void 0;
      this.id = void 0;
      this.states = void 0;
      this.events = void 0;
      this.id = config.id || "(machine)";
      this.implementations = {
        actors: implementations?.actors ?? {},
        actions: implementations?.actions ?? {},
        delays: implementations?.delays ?? {},
        guards: implementations?.guards ?? {}
      };
      this.version = this.config.version;
      this.schemas = this.config.schemas;
      this.transition = this.transition.bind(this);
      this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
      this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
      this.restoreSnapshot = this.restoreSnapshot.bind(this);
      this.start = this.start.bind(this);
      this.root = new StateNode(config, {
        _key: this.id,
        _machine: this
      });
      this.root._initialize();
      this.states = this.root.states;
      this.events = this.root.events;
    }
    /**
     * Clones this state machine with the provided implementations and merges the
     * `context` (if provided).
     *
     * @param implementations Options (`actions`, `guards`, `actors`, `delays`,
     *   `context`) to recursively merge with the existing options.
     * @returns A new `StateMachine` instance with the provided implementations.
     */
    provide(implementations) {
      const {
        actions,
        guards,
        actors,
        delays
      } = this.implementations;
      return new _StateMachine(this.config, {
        actions: {
          ...actions,
          ...implementations.actions
        },
        guards: {
          ...guards,
          ...implementations.guards
        },
        actors: {
          ...actors,
          ...implementations.actors
        },
        delays: {
          ...delays,
          ...implementations.delays
        }
      });
    }
    resolveState(config) {
      const resolvedStateValue = resolveStateValue(this.root, config.value);
      const nodeSet = getAllStateNodes(getStateNodes(this.root, resolvedStateValue));
      return createMachineSnapshot({
        _nodes: [...nodeSet],
        context: config.context || {},
        children: {},
        status: isInFinalState(nodeSet, this.root) ? "done" : config.status || "active",
        output: config.output,
        error: config.error,
        historyValue: config.historyValue
      }, this);
    }
    /**
     * Determines the next snapshot given the current `snapshot` and received
     * `event`. Calculates a full macrostep from all microsteps.
     *
     * @param snapshot The current snapshot
     * @param event The received event
     */
    transition(snapshot, event, actorScope) {
      return macrostep(snapshot, event, actorScope, []).snapshot;
    }
    /**
     * Determines the next state given the current `state` and `event`. Calculates
     * a microstep.
     *
     * @param state The current state
     * @param event The received event
     */
    microstep(snapshot, event, actorScope) {
      return macrostep(snapshot, event, actorScope, []).microstates;
    }
    getTransitionData(snapshot, event) {
      return transitionNode(this.root, snapshot.value, snapshot, event) || [];
    }
    /**
     * The initial state _before_ evaluating any microsteps. This "pre-initial"
     * state is provided to initial actions executed in the initial state.
     */
    getPreInitialState(actorScope, initEvent, internalQueue) {
      const {
        context
      } = this.config;
      const preInitial = createMachineSnapshot({
        context: typeof context !== "function" && context ? context : {},
        _nodes: [this.root],
        children: {},
        status: "active"
      }, this);
      if (typeof context === "function") {
        const assignment = ({
          spawn,
          event,
          self: self2
        }) => context({
          spawn,
          input: event.input,
          self: self2
        });
        return resolveActionsAndContext(preInitial, initEvent, actorScope, [assign(assignment)], internalQueue, void 0);
      }
      return preInitial;
    }
    /**
     * Returns the initial `State` instance, with reference to `self` as an
     * `ActorRef`.
     */
    getInitialSnapshot(actorScope, input) {
      const initEvent = createInitEvent(input);
      const internalQueue = [];
      const preInitialState = this.getPreInitialState(actorScope, initEvent, internalQueue);
      const nextState = microstep([{
        target: [...getInitialStateNodes(this.root)],
        source: this.root,
        reenter: true,
        actions: [],
        eventType: null,
        toJSON: null
        // TODO: fix
      }], preInitialState, actorScope, initEvent, true, internalQueue);
      const {
        snapshot: macroState
      } = macrostep(nextState, initEvent, actorScope, internalQueue);
      return macroState;
    }
    start(snapshot) {
      Object.values(snapshot.children).forEach((child) => {
        if (child.getSnapshot().status === "active") {
          child.start();
        }
      });
    }
    getStateNodeById(stateId) {
      const fullPath = toStatePath(stateId);
      const relativePath = fullPath.slice(1);
      const resolvedStateId = isStateId(fullPath[0]) ? fullPath[0].slice(STATE_IDENTIFIER2.length) : fullPath[0];
      const stateNode = this.idMap.get(resolvedStateId);
      if (!stateNode) {
        throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
      }
      return getStateNodeByPath(stateNode, relativePath);
    }
    get definition() {
      return this.root.definition;
    }
    toJSON() {
      return this.definition;
    }
    getPersistedSnapshot(snapshot, options) {
      return getPersistedSnapshot(snapshot, options);
    }
    restoreSnapshot(snapshot, _actorScope) {
      const children = {};
      const snapshotChildren = snapshot.children;
      Object.keys(snapshotChildren).forEach((actorId) => {
        const actorData = snapshotChildren[actorId];
        const childState = actorData.snapshot;
        const src = actorData.src;
        const logic = typeof src === "string" ? resolveReferencedActor(this, src) : src;
        if (!logic) {
          return;
        }
        const actorRef = createActor(logic, {
          id: actorId,
          parent: _actorScope.self,
          syncSnapshot: actorData.syncSnapshot,
          snapshot: childState,
          src,
          systemId: actorData.systemId
        });
        children[actorId] = actorRef;
      });
      const restoredSnapshot = createMachineSnapshot({
        ...snapshot,
        children,
        _nodes: Array.from(getAllStateNodes(getStateNodes(this.root, snapshot.value)))
      }, this);
      const seen = /* @__PURE__ */ new Set();
      function reviveContext(contextPart, children2) {
        if (seen.has(contextPart)) {
          return;
        }
        seen.add(contextPart);
        for (const key in contextPart) {
          const value2 = contextPart[key];
          if (value2 && typeof value2 === "object") {
            if ("xstate$$type" in value2 && value2.xstate$$type === $$ACTOR_TYPE) {
              contextPart[key] = children2[value2.id];
              continue;
            }
            reviveContext(value2, children2);
          }
        }
      }
      reviveContext(restoredSnapshot.context, children);
      return restoredSnapshot;
    }
  };
  function createMachine(config, implementations) {
    return new StateMachine(config, implementations);
  }
  function setup({
    schemas,
    actors,
    actions,
    guards,
    delays
  }) {
    return {
      createMachine: (config) => createMachine({
        ...config,
        schemas
      }, {
        actors,
        actions,
        guards,
        delays
      })
    };
  }

  // ../client/dist/types/gameMessages.js
  var GameMsg;
  (function(GameMsg2) {
    GameMsg2["DUMMY"] = "game:dummy";
    GameMsg2["SALUTE"] = "game:salute";
    GameMsg2["STARTED"] = "game:started";
    GameMsg2["FINISHED"] = "game:finished";
    GameMsg2["READY"] = "game:player_ready";
    GameMsg2["WAITING"] = "game:player_waiting";
    GameMsg2["TURN_START"] = "game:turn_start";
    GameMsg2["TURN_END"] = "game:turn_end";
    GameMsg2["QUERY"] = "game:query";
    GameMsg2["ANSWER"] = "game:answer";
    GameMsg2["UPDATE"] = "game:update";
    GameMsg2["REPORT"] = "game:report";
  })(GameMsg || (GameMsg = {}));

  // ../client/dist/client/game/gameclient.js
  var Actors;
  (function(Actors2) {
    Actors2["notifyReady"] = "notifyReady";
    Actors2["advertiseWaiting"] = "advertiseWaiting";
    Actors2["processActivePlayer"] = "processActivePlayer";
    Actors2["processNonActivePlayer"] = "processNonActivePlayer";
    Actors2["processEliminated"] = "processEliminated";
  })(Actors || (Actors = {}));
  var Guards;
  (function(Guards2) {
    Guards2["isActivePlayer"] = "isActivePlayer";
    Guards2["isNonActivePlayer"] = "isNonActivePlayer";
    Guards2["isEliminated"] = "isEliminated";
    Guards2["isWaiting"] = "isWaiting";
  })(Guards || (Guards = {}));
  var PlayerStates;
  (function(PlayerStates2) {
    PlayerStates2["Ready"] = "READY";
    PlayerStates2["UpdateTurnInfo"] = "UPDATE_TURN_INFO";
    PlayerStates2["SelectActive"] = "SELECT_ACTIVE";
    PlayerStates2["Active"] = "ACTIVE";
    PlayerStates2["NonActive"] = "NON_ACTIVE";
  })(PlayerStates || (PlayerStates = {}));
  var Actions;
  (function(Actions2) {
    Actions2["log"] = "log";
    Actions2["updateTurnInfo"] = "updateTurnInfo";
    Actions2["advertiseWait"] = "advertiseWait";
    Actions2["markUsWaiting"] = "markUsWaiting";
    Actions2["unMarkUsWaiting"] = "unMarkUsWaiting";
  })(Actions || (Actions = {}));
  var ClientEvent;
  (function(ClientEvent2) {
    ClientEvent2["QueryWaiting"] = "QUERY_WAITING";
  })(ClientEvent || (ClientEvent = {}));
  function isTurnStartEvent(event) {
    return event.type === GameMsg.TURN_START;
  }
  function _createLogger(name, sender) {
    const prefix = name.split("-")[0];
    const now = () => Number(/* @__PURE__ */ new Date());
    const log2 = (...args) => console.log(`${now()} [${prefix}] [${sender}]`, ...args);
    return log2;
  }
  function serMap(map) {
    const o = {};
    map.forEach((v, k) => o[k] = v);
    return o;
  }
  var stringify = (o) => JSON.stringify(o, (_, v) => v instanceof Map ? serMap(v) : v);
  var GameClient = class _GameClient {
    log;
    token;
    sockets;
    turnsData;
    turnData;
    gameMachine;
    constructor(token, sockets) {
      this.sockets = sockets;
      this.turnsData = [];
      this.turnData = _GameClient._emptyTurnData();
      this.log = _createLogger(token, sockets.sender);
      this.token = token;
    }
    static _emptyTurnData() {
      return {
        activePlayer: "",
        queries: /* @__PURE__ */ new Map(),
        answers: /* @__PURE__ */ new Map(),
        updates: /* @__PURE__ */ new Map(),
        report: null
      };
    }
    get playerId() {
      return this.sockets.game.id;
    }
    async play() {
      await this.setupGame();
      this.gameMachine = createActor(this.stateMachine());
      this.gameMachine.start();
    }
    async notifyPlayerReady() {
      await this.sockets.advertisePlayerAsReady();
      this.log("We are ready!");
    }
    /*///////////////////////////////////////////////////////////////
                            STATE MACHINE STATE GETTERS
    //////////////////////////////////////////////////////////////*/
    get contextWaiting() {
      return this.gameMachine.getSnapshot().context.waiting;
    }
    get contextTurnInfo() {
      return this.gameMachine.getSnapshot().context.turnInfo;
    }
    get turn() {
      return this.contextTurnInfo.turn;
    }
    get round() {
      return this.contextTurnInfo.round;
    }
    get activePlayer() {
      return this.contextTurnInfo.activePlayer;
    }
    get nextPlayer() {
      return this.contextTurnInfo.nextPlayer;
    }
    get activeStatus() {
      if (!this.activePlayer) {
        return "";
      } else {
        return this.activePlayer === this.playerId ? "ACTIVE" : "NON-ACTIVE";
      }
    }
    gameLog(...args) {
      this.log(this.activeStatus, ...args);
    }
    async setupGame() {
      this.log("Setting up game...");
    }
    async processActivePlayer() {
      const otherPlayers = this.round.filter((x) => x !== this.playerId);
      await Promise.all([
        this.waitForQuery(otherPlayers),
        this.takeAction()
      ]);
      const answers = await this.createAnswers();
      await Promise.all(answers.map(async (answer) => {
        this.gameLog("Broadcasting answers");
        await this.sockets.broadcastAnswer(this.turn, answer.to, answer);
      }));
      this.gameLog("NO MORE ANSWERS TO BROADCAST", stringify(this.turnData.answers));
      await this.waitForUpdates(otherPlayers);
      const report = await this.createReport();
      this.gameLog("Broadcasting report");
      await this.sockets.broadcastReport(this.turn, report);
      this.gameLog("Finishing turn.");
      this.gameLog("No more duties.");
    }
    async processNonActivePlayer() {
      const nonActivePlayers = this.round.filter((x) => x !== this.activePlayer);
      const otherNonActivePlayers = nonActivePlayers.filter((x) => x !== this.playerId);
      const query = await this.getQuery();
      await Promise.all([
        this.sockets.broadcastQuery(this.turn, this.activePlayer, query),
        this.waitForQuery(otherNonActivePlayers)
        // we have our query, but we need the other NA-players'
      ]);
      this.gameLog("NO MORE QUERIES TO BROADCAST", stringify(this.turnData.queries));
      await this.waitForAnswer(nonActivePlayers);
      const update = await this.createUpdate();
      await Promise.all([
        await this.sockets.broadcastUpdate(this.turn, this.activePlayer, update),
        await this.waitForUpdates(otherNonActivePlayers)
      ]);
      await this.waitForReport();
      this.gameLog("No more duties.");
    }
    /*///////////////////////////////////////////////////////////////
                            NON-ACTIVE PLAYER METHODS
    //////////////////////////////////////////////////////////////*/
    async getQuery() {
      const payload = {
        mockQueryData: {
          token: this.token,
          turn: `Mock-Q${this.contextTurnInfo.turn}`
        }
      };
      this.turnData.queries.set(this.playerId, payload);
      return payload;
    }
    async waitForAnswer(players) {
      this.gameLog("STARTING WAIT FOR ANSWER");
      const answers = await this.sockets.waitForAnswer(this.turn, this.activePlayer, players);
      this.gameLog("Returned answer", stringify(answers));
      this.turnData.answers = answers;
    }
    async createUpdate() {
      this.gameLog("Creating update for active player");
      const payload = {
        mockUpdateData: {
          token: this.token,
          turn: `Mock-U${this.turn}`
        }
      };
      this.turnData.updates.set(this.playerId, payload);
      return payload;
    }
    async waitForReport() {
      const report = await this.sockets.waitForReport(this.turn, this.activePlayer);
      this.gameLog("Returned report", stringify(report));
      this.turnData.report = report;
    }
    /*///////////////////////////////////////////////////////////////
                            ACTIVE PLAYER METHODS
    //////////////////////////////////////////////////////////////*/
    async takeAction() {
    }
    async waitForQuery(players) {
      const queries = await this.sockets.waitForQuery(this.turn, this.activePlayer, players);
      this.gameLog("Returned queries", stringify(queries));
      queries.forEach((payload, player) => {
        this.turnData.queries.set(player, payload);
      });
    }
    async createAnswers() {
      const otherPlayers = this.round.filter((x) => x !== this.playerId);
      const payloads = [];
      for (const player of otherPlayers) {
        const payload = {
          from: this.token,
          to: player,
          data: `Mock-A${this.contextTurnInfo.turn}`
        };
        payloads.push(payload);
        this.turnData.answers.set(player, payload.data);
      }
      return payloads;
    }
    async waitForUpdates(players) {
      this.gameLog("Waiting for updates");
      const updates = await this.sockets.waitForUpdates(this.turn, this.activePlayer, players);
      this.gameLog("Returned updates", stringify(updates));
      this.turnData.updates = updates;
    }
    async createReport() {
      return {
        mockReportData: {
          token: this.token,
          turn: `Mock-R${this.contextTurnInfo.turn}`
        }
      };
    }
    /*///////////////////////////////////////////////////////////////
                            STATE MACHINE
    //////////////////////////////////////////////////////////////*/
    rotateTurnData(turnInfo) {
      this.turnsData.push(this.turnData);
      this.turnData = _GameClient._emptyTurnData();
      this.turnData.activePlayer = turnInfo.activePlayer;
    }
    isActivePlayer(turnInfo) {
      return this.playerId === turnInfo.activePlayer;
    }
    isNonActivePlayer(turnInfo) {
      return turnInfo.round.indexOf(this.playerId) > -1 && this.playerId !== turnInfo.activePlayer;
    }
    machineSetup() {
      const self2 = this;
      this.sockets.addListener(GameMsg.TURN_START, (turnInfo) => {
        if (self2.gameMachine) {
          self2.gameMachine.send({ type: GameMsg.TURN_START, turnInfo });
        }
      });
      this.sockets.game.on(GameMsg.WAITING, (ack) => {
        if (self2.gameMachine) {
          ack({ player: self2.playerId, waiting: self2.contextWaiting });
        }
      });
      const updateTurnInfoAction = ({ event, context }) => {
        if (isTurnStartEvent(event)) {
          self2.rotateTurnData(event.turnInfo);
          return { turnInfo: event.turnInfo };
        } else
          return context;
      };
      const markUsWaitingAction = ({ event, context }) => {
        this.log("markUsWaiting", stringify(context));
        return { ...context, waiting: true };
      };
      const unMarkUsWaitingAction = ({ event, context }) => {
        return { ...context, waiting: false };
      };
      const template = setup({
        types: {
          context: {},
          events: {}
        },
        actions: {
          log: (o, step) => this.log(step ? `[${step}]` : "", o.event.type, JSON.stringify(o.context)),
          [Actions.updateTurnInfo]: assign(updateTurnInfoAction),
          [Actions.markUsWaiting]: assign(markUsWaitingAction),
          [Actions.unMarkUsWaiting]: assign(unMarkUsWaitingAction)
        },
        guards: {
          [Guards.isActivePlayer]: ({ context }) => this.isActivePlayer(context.turnInfo),
          [Guards.isNonActivePlayer]: ({ context }) => this.isNonActivePlayer(context.turnInfo)
        },
        actors: {
          [Actors.notifyReady]: fromPromise(this.notifyPlayerReady.bind(this)),
          // [Actors.processActivePlayer]: fromPromise<void, void>(async () => { await passTime(3_000); this.log("Finished Active") } ),
          // [Actors.processNonActivePlayer]: fromPromise<void, void>(async () => { await passTime(3_000); this.log("Finished NonActive") }),
          [Actors.processActivePlayer]: fromPromise(this.processActivePlayer.bind(this)),
          [Actors.processNonActivePlayer]: fromPromise(this.processNonActivePlayer.bind(this))
        }
      });
      return template;
    }
    stateMachine() {
      const actor = this.machineSetup().createMachine({
        id: "game_loop",
        context: { turnInfo: null, waiting: false },
        initial: PlayerStates.Ready,
        states: {
          [PlayerStates.Ready]: {
            entry: [{ type: Actions.log, params: PlayerStates.Ready }],
            invoke: { src: Actors.notifyReady, onDone: { target: PlayerStates.UpdateTurnInfo } }
          },
          [PlayerStates.UpdateTurnInfo]: {
            entry: [
              { type: Actions.log, params: PlayerStates.UpdateTurnInfo },
              { type: Actions.markUsWaiting }
            ],
            on: {
              [GameMsg.TURN_START]: [
                { actions: { type: Actions.updateTurnInfo }, target: PlayerStates.SelectActive }
              ]
            },
            exit: [{ type: Actions.unMarkUsWaiting }]
          },
          [PlayerStates.SelectActive]: {
            entry: [
              { type: Actions.log, params: PlayerStates.SelectActive }
            ],
            always: [
              { guard: Guards.isActivePlayer, target: PlayerStates.Active },
              { guard: Guards.isNonActivePlayer, target: PlayerStates.NonActive }
            ]
          },
          [PlayerStates.Active]: {
            entry: [{ type: Actions.log, params: PlayerStates.Active }],
            invoke: { src: Actors.processActivePlayer, onDone: { target: PlayerStates.UpdateTurnInfo } }
          },
          [PlayerStates.NonActive]: {
            entry: [{ type: Actions.log, params: PlayerStates.NonActive }],
            invoke: { src: Actors.processNonActivePlayer, onDone: { target: PlayerStates.UpdateTurnInfo } }
          }
        }
      });
      return actor;
    }
  };

  // ../../node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs
  var import_index = __toESM(require_eventemitter3(), 1);

  // ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/commons.js
  var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
  Object.keys(PACKET_TYPES).forEach((key) => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  var ERROR_PACKET = { type: "error", data: "parser error" };

  // ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/encodePacket.browser.js
  var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
  var withNativeArrayBuffer = typeof ArrayBuffer === "function";
  var isView = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
  };
  var encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob && data instanceof Blob) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(data, callback);
      }
    } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(new Blob([data]), callback);
      }
    }
    return callback(PACKET_TYPES[type] + (data || ""));
  };
  var encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = fileReader.result.split(",")[1];
      callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
  };
  function toArray2(data) {
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
  }
  var TEXT_ENCODER;
  function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
      return packet.data.arrayBuffer().then(toArray2).then(callback);
    } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
      return callback(toArray2(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
      if (!TEXT_ENCODER) {
        TEXT_ENCODER = new TextEncoder();
      }
      callback(TEXT_ENCODER.encode(encoded));
    });
  }

  // ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var decode = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };

  // ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/decodePacket.browser.js
  var withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
  var decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
      return {
        type: "message",
        data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
      };
    }
    const packetType = PACKET_TYPES_REVERSE[type];
    if (!packetType) {
      return ERROR_PACKET;
    }
    return encodedPacket.length > 1 ? {
      type: PACKET_TYPES_REVERSE[type],
      data: encodedPacket.substring(1)
    } : {
      type: PACKET_TYPES_REVERSE[type]
    };
  };
  var decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer2) {
      const decoded = decode(data);
      return mapBinary(decoded, binaryType);
    } else {
      return { base64: true, data };
    }
  };
  var mapBinary = (data, binaryType) => {
    switch (binaryType) {
      case "blob":
        if (data instanceof Blob) {
          return data;
        } else {
          return new Blob([data]);
        }
      case "arraybuffer":
      default:
        if (data instanceof ArrayBuffer) {
          return data;
        } else {
          return data.buffer;
        }
    }
  };

  // ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/index.js
  var SEPARATOR = String.fromCharCode(30);
  var encodePayload = (packets, callback) => {
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
      encodePacket(packet, false, (encodedPacket) => {
        encodedPackets[i] = encodedPacket;
        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  };
  var decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
      const decodedPacket = decodePacket(encodedPackets[i], binaryType);
      packets.push(decodedPacket);
      if (decodedPacket.type === "error") {
        break;
      }
    }
    return packets;
  };
  function createPacketEncoderStream() {
    return new TransformStream({
      transform(packet, controller) {
        encodePacketToBinary(packet, (encodedPacket) => {
          const payloadLength = encodedPacket.length;
          let header;
          if (payloadLength < 126) {
            header = new Uint8Array(1);
            new DataView(header.buffer).setUint8(0, payloadLength);
          } else if (payloadLength < 65536) {
            header = new Uint8Array(3);
            const view = new DataView(header.buffer);
            view.setUint8(0, 126);
            view.setUint16(1, payloadLength);
          } else {
            header = new Uint8Array(9);
            const view = new DataView(header.buffer);
            view.setUint8(0, 127);
            view.setBigUint64(1, BigInt(payloadLength));
          }
          if (packet.data && typeof packet.data !== "string") {
            header[0] |= 128;
          }
          controller.enqueue(header);
          controller.enqueue(encodedPacket);
        });
      }
    });
  }
  var TEXT_DECODER;
  function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
      return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
      buffer[i] = chunks[0][j++];
      if (j === chunks[0].length) {
        chunks.shift();
        j = 0;
      }
    }
    if (chunks.length && j < chunks[0].length) {
      chunks[0] = chunks[0].slice(j);
    }
    return buffer;
  }
  function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
      TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0;
    let expectedLength = -1;
    let isBinary2 = false;
    return new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        while (true) {
          if (state === 0) {
            if (totalLength(chunks) < 1) {
              break;
            }
            const header = concatChunks(chunks, 1);
            isBinary2 = (header[0] & 128) === 128;
            expectedLength = header[0] & 127;
            if (expectedLength < 126) {
              state = 3;
            } else if (expectedLength === 126) {
              state = 1;
            } else {
              state = 2;
            }
          } else if (state === 1) {
            if (totalLength(chunks) < 2) {
              break;
            }
            const headerArray = concatChunks(chunks, 2);
            expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
            state = 3;
          } else if (state === 2) {
            if (totalLength(chunks) < 8) {
              break;
            }
            const headerArray = concatChunks(chunks, 8);
            const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
            const n = view.getUint32(0);
            if (n > Math.pow(2, 53 - 32) - 1) {
              controller.enqueue(ERROR_PACKET);
              break;
            }
            expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
            state = 3;
          } else {
            if (totalLength(chunks) < expectedLength) {
              break;
            }
            const data = concatChunks(chunks, expectedLength);
            controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
            state = 0;
          }
          if (expectedLength === 0 || expectedLength > maxPayload) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
        }
      }
    });
  }
  var protocol = 4;

  // ../../node_modules/.pnpm/@socket.io+component-emitter@3.1.2/node_modules/@socket.io/component-emitter/lib/esm/index.js
  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
    return this;
  };
  Emitter.prototype.once = function(event, fn) {
    function on2() {
      this.off(event, on2);
      fn.apply(this, arguments);
    }
    on2.fn = fn;
    this.on(event, on2);
    return this;
  };
  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }
    var callbacks = this._callbacks["$" + event];
    if (!callbacks) return this;
    if (1 == arguments.length) {
      delete this._callbacks["$" + event];
      return this;
    }
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    if (callbacks.length === 0) {
      delete this._callbacks["$" + event];
    }
    return this;
  };
  Emitter.prototype.emit = function(event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }
    return this;
  };
  Emitter.prototype.emitReserved = Emitter.prototype.emit;
  Emitter.prototype.listeners = function(event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks["$" + event] || [];
  };
  Emitter.prototype.hasListeners = function(event) {
    return !!this.listeners(event).length;
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/globals.js
  var nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
      return (cb) => Promise.resolve().then(cb);
    } else {
      return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
  })();
  var globalThisShim = (() => {
    if (typeof self !== "undefined") {
      return self;
    } else if (typeof window !== "undefined") {
      return window;
    } else {
      return Function("return this")();
    }
  })();
  var defaultBinaryType = "arraybuffer";
  function createCookieJar() {
  }

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/util.js
  function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
      return acc;
    }, {});
  }
  var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
  var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    } else {
      obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
      obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
  }
  var BASE64_OVERHEAD = 1.33;
  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    }
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        length += 1;
      } else if (c < 2048) {
        length += 2;
      } else if (c < 55296 || c >= 57344) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }
    return length;
  }
  function randomString() {
    return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
  }

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/contrib/parseqs.js
  function encode(obj) {
    let str = "";
    for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length)
          str += "&";
        str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
      }
    }
    return str;
  }
  function decode2(qs) {
    let qry = {};
    let pairs = qs.split("&");
    for (let i = 0, l = pairs.length; i < l; i++) {
      let pair = pairs[i].split("=");
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  }

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/transport.js
  var TransportError = class extends Error {
    constructor(reason, description, context) {
      super(reason);
      this.description = description;
      this.context = context;
      this.type = "TransportError";
    }
  };
  var Transport = class extends Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
      super();
      this.writable = false;
      installTimerFunctions(this, opts);
      this.opts = opts;
      this.query = opts.query;
      this.socket = opts.socket;
      this.supportsBinary = !opts.forceBase64;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
      super.emitReserved("error", new TransportError(reason, description, context));
      return this;
    }
    /**
     * Opens the transport.
     */
    open() {
      this.readyState = "opening";
      this.doOpen();
      return this;
    }
    /**
     * Closes the transport.
     */
    close() {
      if (this.readyState === "opening" || this.readyState === "open") {
        this.doClose();
        this.onClose();
      }
      return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
      if (this.readyState === "open") {
        this.write(packets);
      } else {
      }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
      this.readyState = "open";
      this.writable = true;
      super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
      const packet = decodePacket(data, this.socket.binaryType);
      this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
      super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
      this.readyState = "closed";
      super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) {
    }
    createUri(schema, query = {}) {
      return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
    }
    _hostname() {
      const hostname = this.opts.hostname;
      return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
      if (this.opts.port && (this.opts.secure && Number(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80)) {
        return ":" + this.opts.port;
      } else {
        return "";
      }
    }
    _query(query) {
      const encodedQuery = encode(query);
      return encodedQuery.length ? "?" + encodedQuery : "";
    }
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/transports/polling.js
  var Polling = class extends Transport {
    constructor() {
      super(...arguments);
      this._polling = false;
    }
    get name() {
      return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
      this._poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
      this.readyState = "pausing";
      const pause = () => {
        this.readyState = "paused";
        onPause();
      };
      if (this._polling || !this.writable) {
        let total = 0;
        if (this._polling) {
          total++;
          this.once("pollComplete", function() {
            --total || pause();
          });
        }
        if (!this.writable) {
          total++;
          this.once("drain", function() {
            --total || pause();
          });
        }
      } else {
        pause();
      }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    _poll() {
      this._polling = true;
      this.doPoll();
      this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
      const callback = (packet) => {
        if ("opening" === this.readyState && packet.type === "open") {
          this.onOpen();
        }
        if ("close" === packet.type) {
          this.onClose({ description: "transport closed by the server" });
          return false;
        }
        this.onPacket(packet);
      };
      decodePayload(data, this.socket.binaryType).forEach(callback);
      if ("closed" !== this.readyState) {
        this._polling = false;
        this.emitReserved("pollComplete");
        if ("open" === this.readyState) {
          this._poll();
        } else {
        }
      }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
      const close = () => {
        this.write([{ type: "close" }]);
      };
      if ("open" === this.readyState) {
        close();
      } else {
        this.once("open", close);
      }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
      this.writable = false;
      encodePayload(packets, (data) => {
        this.doWrite(data, () => {
          this.writable = true;
          this.emitReserved("drain");
        });
      });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "https" : "http";
      const query = this.query || {};
      if (false !== this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary && !query.sid) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/contrib/has-cors.js
  var value = false;
  try {
    value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
  } catch (err) {
  }
  var hasCORS = value;

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/transports/polling-xhr.js
  function empty() {
  }
  var BaseXHR = class extends Polling {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
      super(opts);
      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;
        if (!port) {
          port = isSSL ? "443" : "80";
        }
        this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
      }
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
      const req = this.request({
        method: "POST",
        data
      });
      req.on("success", fn);
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr post error", xhrStatus, context);
      });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
      const req = this.request();
      req.on("data", this.onData.bind(this));
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr poll error", xhrStatus, context);
      });
      this.pollXhr = req;
    }
  };
  var Request = class _Request extends Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(createRequest, uri, opts) {
      super();
      this.createRequest = createRequest;
      installTimerFunctions(this, opts);
      this._opts = opts;
      this._method = opts.method || "GET";
      this._uri = uri;
      this._data = void 0 !== opts.data ? opts.data : null;
      this._create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    _create() {
      var _a;
      const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
      opts.xdomain = !!this._opts.xd;
      const xhr = this._xhr = this.createRequest(opts);
      try {
        xhr.open(this._method, this._uri, true);
        try {
          if (this._opts.extraHeaders) {
            xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
            for (let i in this._opts.extraHeaders) {
              if (this._opts.extraHeaders.hasOwnProperty(i)) {
                xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
              }
            }
          }
        } catch (e) {
        }
        if ("POST" === this._method) {
          try {
            xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
          } catch (e) {
          }
        }
        try {
          xhr.setRequestHeader("Accept", "*/*");
        } catch (e) {
        }
        (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
        if ("withCredentials" in xhr) {
          xhr.withCredentials = this._opts.withCredentials;
        }
        if (this._opts.requestTimeout) {
          xhr.timeout = this._opts.requestTimeout;
        }
        xhr.onreadystatechange = () => {
          var _a2;
          if (xhr.readyState === 3) {
            (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
              // @ts-ignore
              xhr.getResponseHeader("set-cookie")
            );
          }
          if (4 !== xhr.readyState)
            return;
          if (200 === xhr.status || 1223 === xhr.status) {
            this._onLoad();
          } else {
            this.setTimeoutFn(() => {
              this._onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
        xhr.send(this._data);
      } catch (e) {
        this.setTimeoutFn(() => {
          this._onError(e);
        }, 0);
        return;
      }
      if (typeof document !== "undefined") {
        this._index = _Request.requestsCount++;
        _Request.requests[this._index] = this;
      }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    _onError(err) {
      this.emitReserved("error", err, this._xhr);
      this._cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    _cleanup(fromError) {
      if ("undefined" === typeof this._xhr || null === this._xhr) {
        return;
      }
      this._xhr.onreadystatechange = empty;
      if (fromError) {
        try {
          this._xhr.abort();
        } catch (e) {
        }
      }
      if (typeof document !== "undefined") {
        delete _Request.requests[this._index];
      }
      this._xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    _onLoad() {
      const data = this._xhr.responseText;
      if (data !== null) {
        this.emitReserved("data", data);
        this.emitReserved("success");
        this._cleanup();
      }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
      this._cleanup();
    }
  };
  Request.requestsCount = 0;
  Request.requests = {};
  if (typeof document !== "undefined") {
    if (typeof attachEvent === "function") {
      attachEvent("onunload", unloadHandler);
    } else if (typeof addEventListener === "function") {
      const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }
  function unloadHandler() {
    for (let i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  }
  var hasXHR2 = function() {
    const xhr = newRequest({
      xdomain: false
    });
    return xhr && xhr.responseType !== null;
  }();
  var XHR = class extends BaseXHR {
    constructor(opts) {
      super(opts);
      const forceBase64 = opts && opts.forceBase64;
      this.supportsBinary = hasXHR2 && !forceBase64;
    }
    request(opts = {}) {
      Object.assign(opts, { xd: this.xd }, this.opts);
      return new Request(newRequest, this.uri(), opts);
    }
  };
  function newRequest(opts) {
    const xdomain = opts.xdomain;
    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {
    }
    if (!xdomain) {
      try {
        return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {
      }
    }
  }

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/transports/websocket.js
  var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
  var BaseWS = class extends Transport {
    get name() {
      return "websocket";
    }
    doOpen() {
      const uri = this.uri();
      const protocols = this.opts.protocols;
      const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
      if (this.opts.extraHeaders) {
        opts.headers = this.opts.extraHeaders;
      }
      try {
        this.ws = this.createSocket(uri, protocols, opts);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this.ws.binaryType = this.socket.binaryType;
      this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
      this.ws.onopen = () => {
        if (this.opts.autoUnref) {
          this.ws._socket.unref();
        }
        this.onOpen();
      };
      this.ws.onclose = (closeEvent) => this.onClose({
        description: "websocket connection closed",
        context: closeEvent
      });
      this.ws.onmessage = (ev) => this.onData(ev.data);
      this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        encodePacket(packet, this.supportsBinary, (data) => {
          try {
            this.doWrite(packet, data);
          } catch (e) {
          }
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      if (typeof this.ws !== "undefined") {
        this.ws.onerror = () => {
        };
        this.ws.close();
        this.ws = null;
      }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "wss" : "ws";
      const query = this.query || {};
      if (this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };
  var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
  var WS = class extends BaseWS {
    createSocket(uri, protocols, opts) {
      return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
    }
    doWrite(_packet, data) {
      this.ws.send(data);
    }
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/transports/webtransport.js
  var WT = class extends Transport {
    get name() {
      return "webtransport";
    }
    doOpen() {
      try {
        this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this._transport.closed.then(() => {
        this.onClose();
      }).catch((err) => {
        this.onError("webtransport error", err);
      });
      this._transport.ready.then(() => {
        this._transport.createBidirectionalStream().then((stream) => {
          const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
          const reader = stream.readable.pipeThrough(decoderStream).getReader();
          const encoderStream = createPacketEncoderStream();
          encoderStream.readable.pipeTo(stream.writable);
          this._writer = encoderStream.writable.getWriter();
          const read = () => {
            reader.read().then(({ done, value: value2 }) => {
              if (done) {
                return;
              }
              this.onPacket(value2);
              read();
            }).catch((err) => {
            });
          };
          read();
          const packet = { type: "open" };
          if (this.query.sid) {
            packet.data = `{"sid":"${this.query.sid}"}`;
          }
          this._writer.write(packet).then(() => this.onOpen());
        });
      });
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        this._writer.write(packet).then(() => {
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      var _a;
      (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
    }
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/transports/index.js
  var transports = {
    websocket: WS,
    webtransport: WT,
    polling: XHR
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/contrib/parseuri.js
  var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  var parts = [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor"
  ];
  function parse(str) {
    if (str.length > 8e3) {
      throw "URI too long";
    }
    const src = str, b = str.indexOf("["), e = str.indexOf("]");
    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
    }
    let m = re.exec(str || ""), uri = {}, i = 14;
    while (i--) {
      uri[parts[i]] = m[i] || "";
    }
    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
      uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
      uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri["path"]);
    uri.queryKey = queryKey(uri, uri["query"]);
    return uri;
  }
  function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == "/" || path.length === 0) {
      names.splice(0, 1);
    }
    if (path.slice(-1) == "/") {
      names.splice(names.length - 1, 1);
    }
    return names;
  }
  function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/socket.js
  var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
  var OFFLINE_EVENT_LISTENERS = [];
  if (withEventListeners) {
    addEventListener("offline", () => {
      OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
    }, false);
  }
  var SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts) {
      super();
      this.binaryType = defaultBinaryType;
      this.writeBuffer = [];
      this._prevBufferLen = 0;
      this._pingInterval = -1;
      this._pingTimeout = -1;
      this._maxPayload = -1;
      this._pingTimeoutTime = Infinity;
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = null;
      }
      if (uri) {
        const parsedUri = parse(uri);
        opts.hostname = parsedUri.host;
        opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
        opts.port = parsedUri.port;
        if (parsedUri.query)
          opts.query = parsedUri.query;
      } else if (opts.host) {
        opts.hostname = parse(opts.host).host;
      }
      installTimerFunctions(this, opts);
      this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
      if (opts.hostname && !opts.port) {
        opts.port = this.secure ? "443" : "80";
      }
      this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
      this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
      this.transports = [];
      this._transportsByName = {};
      opts.transports.forEach((t) => {
        const transportName = t.prototype.name;
        this.transports.push(transportName);
        this._transportsByName[transportName] = t;
      });
      this.opts = Object.assign({
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        timestampParam: "t",
        rememberUpgrade: false,
        addTrailingSlash: true,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {},
        closeOnBeforeunload: false
      }, opts);
      this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
      if (typeof this.opts.query === "string") {
        this.opts.query = decode2(this.opts.query);
      }
      if (withEventListeners) {
        if (this.opts.closeOnBeforeunload) {
          this._beforeunloadEventListener = () => {
            if (this.transport) {
              this.transport.removeAllListeners();
              this.transport.close();
            }
          };
          addEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this.hostname !== "localhost") {
          this._offlineEventListener = () => {
            this._onClose("transport close", {
              description: "network connection lost"
            });
          };
          OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
        }
      }
      if (this.opts.withCredentials) {
        this._cookieJar = createCookieJar();
      }
      this._open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
      const query = Object.assign({}, this.opts.query);
      query.EIO = protocol;
      query.transport = name;
      if (this.id)
        query.sid = this.id;
      const opts = Object.assign({}, this.opts, {
        query,
        socket: this,
        hostname: this.hostname,
        secure: this.secure,
        port: this.port
      }, this.opts.transportOptions[name]);
      return new this._transportsByName[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    _open() {
      if (this.transports.length === 0) {
        this.setTimeoutFn(() => {
          this.emitReserved("error", "No transports available");
        }, 0);
        return;
      }
      const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
      this.readyState = "opening";
      const transport = this.createTransport(transportName);
      transport.open();
      this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
      if (this.transport) {
        this.transport.removeAllListeners();
      }
      this.transport = transport;
      transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
      this.readyState = "open";
      _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
      this.emitReserved("open");
      this.flush();
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    _onPacket(packet) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.emitReserved("packet", packet);
        this.emitReserved("heartbeat");
        switch (packet.type) {
          case "open":
            this.onHandshake(JSON.parse(packet.data));
            break;
          case "ping":
            this._sendPacket("pong");
            this.emitReserved("ping");
            this.emitReserved("pong");
            this._resetPingTimeout();
            break;
          case "error":
            const err = new Error("server error");
            err.code = packet.data;
            this._onError(err);
            break;
          case "message":
            this.emitReserved("data", packet.data);
            this.emitReserved("message", packet.data);
            break;
        }
      } else {
      }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
      this.emitReserved("handshake", data);
      this.id = data.sid;
      this.transport.query.sid = data.sid;
      this._pingInterval = data.pingInterval;
      this._pingTimeout = data.pingTimeout;
      this._maxPayload = data.maxPayload;
      this.onOpen();
      if ("closed" === this.readyState)
        return;
      this._resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    _resetPingTimeout() {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      const delay = this._pingInterval + this._pingTimeout;
      this._pingTimeoutTime = Date.now() + delay;
      this._pingTimeoutTimer = this.setTimeoutFn(() => {
        this._onClose("ping timeout");
      }, delay);
      if (this.opts.autoUnref) {
        this._pingTimeoutTimer.unref();
      }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    _onDrain() {
      this.writeBuffer.splice(0, this._prevBufferLen);
      this._prevBufferLen = 0;
      if (0 === this.writeBuffer.length) {
        this.emitReserved("drain");
      } else {
        this.flush();
      }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
      if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
        const packets = this._getWritablePackets();
        this.transport.send(packets);
        this._prevBufferLen = packets.length;
        this.emitReserved("flush");
      }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    _getWritablePackets() {
      const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
      if (!shouldCheckPayloadSize) {
        return this.writeBuffer;
      }
      let payloadSize = 1;
      for (let i = 0; i < this.writeBuffer.length; i++) {
        const data = this.writeBuffer[i].data;
        if (data) {
          payloadSize += byteLength(data);
        }
        if (i > 0 && payloadSize > this._maxPayload) {
          return this.writeBuffer.slice(0, i);
        }
        payloadSize += 2;
      }
      return this.writeBuffer;
    }
    /**
     * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
     *
     * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
     * `write()` method then the message would not be buffered by the Socket.IO client.
     *
     * @return {boolean}
     * @private
     */
    /* private */
    _hasPingExpired() {
      if (!this._pingTimeoutTime)
        return true;
      const hasExpired = Date.now() > this._pingTimeoutTime;
      if (hasExpired) {
        this._pingTimeoutTime = 0;
        nextTick(() => {
          this._onClose("ping timeout");
        }, this.setTimeoutFn);
      }
      return hasExpired;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a message. Alias of {@link Socket#write}.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    send(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    _sendPacket(type, data, options, fn) {
      if ("function" === typeof data) {
        fn = data;
        data = void 0;
      }
      if ("function" === typeof options) {
        fn = options;
        options = null;
      }
      if ("closing" === this.readyState || "closed" === this.readyState) {
        return;
      }
      options = options || {};
      options.compress = false !== options.compress;
      const packet = {
        type,
        data,
        options
      };
      this.emitReserved("packetCreate", packet);
      this.writeBuffer.push(packet);
      if (fn)
        this.once("flush", fn);
      this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
      const close = () => {
        this._onClose("forced close");
        this.transport.close();
      };
      const cleanupAndClose = () => {
        this.off("upgrade", cleanupAndClose);
        this.off("upgradeError", cleanupAndClose);
        close();
      };
      const waitForUpgrade = () => {
        this.once("upgrade", cleanupAndClose);
        this.once("upgradeError", cleanupAndClose);
      };
      if ("opening" === this.readyState || "open" === this.readyState) {
        this.readyState = "closing";
        if (this.writeBuffer.length) {
          this.once("drain", () => {
            if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          });
        } else if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      }
      return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    _onError(err) {
      _SocketWithoutUpgrade.priorWebsocketSuccess = false;
      if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
        this.transports.shift();
        return this._open();
      }
      this.emitReserved("error", err);
      this._onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    _onClose(reason, description) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        this.transport.removeAllListeners("close");
        this.transport.close();
        this.transport.removeAllListeners();
        if (withEventListeners) {
          if (this._beforeunloadEventListener) {
            removeEventListener("beforeunload", this._beforeunloadEventListener, false);
          }
          if (this._offlineEventListener) {
            const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
            if (i !== -1) {
              OFFLINE_EVENT_LISTENERS.splice(i, 1);
            }
          }
        }
        this.readyState = "closed";
        this.id = null;
        this.emitReserved("close", reason, description);
        this.writeBuffer = [];
        this._prevBufferLen = 0;
      }
    }
  };
  SocketWithoutUpgrade.protocol = protocol;
  var SocketWithUpgrade = class extends SocketWithoutUpgrade {
    constructor() {
      super(...arguments);
      this._upgrades = [];
    }
    onOpen() {
      super.onOpen();
      if ("open" === this.readyState && this.opts.upgrade) {
        for (let i = 0; i < this._upgrades.length; i++) {
          this._probe(this._upgrades[i]);
        }
      }
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    _probe(name) {
      let transport = this.createTransport(name);
      let failed = false;
      SocketWithoutUpgrade.priorWebsocketSuccess = false;
      const onTransportOpen = () => {
        if (failed)
          return;
        transport.send([{ type: "ping", data: "probe" }]);
        transport.once("packet", (msg) => {
          if (failed)
            return;
          if ("pong" === msg.type && "probe" === msg.data) {
            this.upgrading = true;
            this.emitReserved("upgrading", transport);
            if (!transport)
              return;
            SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
            this.transport.pause(() => {
              if (failed)
                return;
              if ("closed" === this.readyState)
                return;
              cleanup();
              this.setTransport(transport);
              transport.send([{ type: "upgrade" }]);
              this.emitReserved("upgrade", transport);
              transport = null;
              this.upgrading = false;
              this.flush();
            });
          } else {
            const err = new Error("probe error");
            err.transport = transport.name;
            this.emitReserved("upgradeError", err);
          }
        });
      };
      function freezeTransport() {
        if (failed)
          return;
        failed = true;
        cleanup();
        transport.close();
        transport = null;
      }
      const onerror = (err) => {
        const error = new Error("probe error: " + err);
        error.transport = transport.name;
        freezeTransport();
        this.emitReserved("upgradeError", error);
      };
      function onTransportClose() {
        onerror("transport closed");
      }
      function onclose() {
        onerror("socket closed");
      }
      function onupgrade(to) {
        if (transport && to.name !== transport.name) {
          freezeTransport();
        }
      }
      const cleanup = () => {
        transport.removeListener("open", onTransportOpen);
        transport.removeListener("error", onerror);
        transport.removeListener("close", onTransportClose);
        this.off("close", onclose);
        this.off("upgrading", onupgrade);
      };
      transport.once("open", onTransportOpen);
      transport.once("error", onerror);
      transport.once("close", onTransportClose);
      this.once("close", onclose);
      this.once("upgrading", onupgrade);
      if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
        this.setTimeoutFn(() => {
          if (!failed) {
            transport.open();
          }
        }, 200);
      } else {
        transport.open();
      }
    }
    onHandshake(data) {
      this._upgrades = this._filterUpgrades(data.upgrades);
      super.onHandshake(data);
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    _filterUpgrades(upgrades) {
      const filteredUpgrades = [];
      for (let i = 0; i < upgrades.length; i++) {
        if (~this.transports.indexOf(upgrades[i]))
          filteredUpgrades.push(upgrades[i]);
      }
      return filteredUpgrades;
    }
  };
  var Socket = class extends SocketWithUpgrade {
    constructor(uri, opts = {}) {
      const o = typeof uri === "object" ? uri : opts;
      if (!o.transports || o.transports && typeof o.transports[0] === "string") {
        o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t) => !!t);
      }
      super(uri, o);
    }
  };

  // ../../node_modules/.pnpm/engine.io-client@6.6.3/node_modules/engine.io-client/build/esm/index.js
  var protocol2 = Socket.protocol;

  // ../../node_modules/.pnpm/socket.io-client@4.8.1/node_modules/socket.io-client/build/esm/url.js
  function url(uri, path = "", loc) {
    let obj = uri;
    loc = loc || typeof location !== "undefined" && location;
    if (null == uri)
      uri = loc.protocol + "//" + loc.host;
    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }
      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      }
      obj = parse(uri);
    }
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }

  // ../../node_modules/.pnpm/socket.io-parser@4.2.4/node_modules/socket.io-parser/build/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    PacketType: () => PacketType,
    protocol: () => protocol3
  });

  // ../../node_modules/.pnpm/socket.io-parser@4.2.4/node_modules/socket.io-parser/build/esm/is-binary.js
  var withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
  var isView2 = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  var toString = Object.prototype.toString;
  var withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
  var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
  function isBinary(obj) {
    return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
  }
  function hasBinary(obj, toJSON2) {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }
      return false;
    }
    if (isBinary(obj)) {
      return true;
    }
    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }
    return false;
  }

  // ../../node_modules/.pnpm/socket.io-parser@4.2.4/node_modules/socket.io-parser/build/esm/binary.js
  function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length;
    return { packet: pack, buffers };
  }
  function _deconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (isBinary(data)) {
      const placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      const newData = new Array(data.length);
      for (let i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }
      return newData;
    } else if (typeof data === "object" && !(data instanceof Date)) {
      const newData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
      }
      return newData;
    }
    return data;
  }
  function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments;
    return packet;
  }
  function _reconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (data && data._placeholder === true) {
      const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
      if (isIndexValid) {
        return buffers[data.num];
      } else {
        throw new Error("illegal attachments");
      }
    } else if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (typeof data === "object") {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
    }
    return data;
  }

  // ../../node_modules/.pnpm/socket.io-parser@4.2.4/node_modules/socket.io-parser/build/esm/index.js
  var RESERVED_EVENTS = [
    "connect",
    "connect_error",
    "disconnect",
    "disconnecting",
    "newListener",
    "removeListener"
    // used by the Node.js EventEmitter
  ];
  var protocol3 = 5;
  var PacketType;
  (function(PacketType2) {
    PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
    PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
    PacketType2[PacketType2["ACK"] = 3] = "ACK";
    PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  var Encoder = class {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
      this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
      if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
        if (hasBinary(obj)) {
          return this.encodeAsBinary({
            type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
            nsp: obj.nsp,
            data: obj.data,
            id: obj.id
          });
        }
      }
      return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
      let str = "" + obj.type;
      if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
        str += obj.attachments + "-";
      }
      if (obj.nsp && "/" !== obj.nsp) {
        str += obj.nsp + ",";
      }
      if (null != obj.id) {
        str += obj.id;
      }
      if (null != obj.data) {
        str += JSON.stringify(obj.data, this.replacer);
      }
      return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
      const deconstruction = deconstructPacket(obj);
      const pack = this.encodeAsString(deconstruction.packet);
      const buffers = deconstruction.buffers;
      buffers.unshift(pack);
      return buffers;
    }
  };
  function isObject(value2) {
    return Object.prototype.toString.call(value2) === "[object Object]";
  }
  var Decoder = class _Decoder extends Emitter {
    /**
     * Decoder constructor
     *
     * @param {function} reviver - custom reviver to pass down to JSON.stringify
     */
    constructor(reviver) {
      super();
      this.reviver = reviver;
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
      let packet;
      if (typeof obj === "string") {
        if (this.reconstructor) {
          throw new Error("got plaintext data when reconstructing a packet");
        }
        packet = this.decodeString(obj);
        const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
        if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
          packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
          this.reconstructor = new BinaryReconstructor(packet);
          if (packet.attachments === 0) {
            super.emitReserved("decoded", packet);
          }
        } else {
          super.emitReserved("decoded", packet);
        }
      } else if (isBinary(obj) || obj.base64) {
        if (!this.reconstructor) {
          throw new Error("got binary data when not reconstructing a packet");
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) {
            this.reconstructor = null;
            super.emitReserved("decoded", packet);
          }
        }
      } else {
        throw new Error("Unknown type: " + obj);
      }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
      let i = 0;
      const p = {
        type: Number(str.charAt(0))
      };
      if (PacketType[p.type] === void 0) {
        throw new Error("unknown packet type " + p.type);
      }
      if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
        const start = i + 1;
        while (str.charAt(++i) !== "-" && i != str.length) {
        }
        const buf = str.substring(start, i);
        if (buf != Number(buf) || str.charAt(i) !== "-") {
          throw new Error("Illegal attachments");
        }
        p.attachments = Number(buf);
      }
      if ("/" === str.charAt(i + 1)) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if ("," === c)
            break;
          if (i === str.length)
            break;
        }
        p.nsp = str.substring(start, i);
      } else {
        p.nsp = "/";
      }
      const next = str.charAt(i + 1);
      if ("" !== next && Number(next) == next) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          if (i === str.length)
            break;
        }
        p.id = Number(str.substring(start, i + 1));
      }
      if (str.charAt(++i)) {
        const payload = this.tryParse(str.substr(i));
        if (_Decoder.isPayloadValid(p.type, payload)) {
          p.data = payload;
        } else {
          throw new Error("invalid payload");
        }
      }
      return p;
    }
    tryParse(str) {
      try {
        return JSON.parse(str, this.reviver);
      } catch (e) {
        return false;
      }
    }
    static isPayloadValid(type, payload) {
      switch (type) {
        case PacketType.CONNECT:
          return isObject(payload);
        case PacketType.DISCONNECT:
          return payload === void 0;
        case PacketType.CONNECT_ERROR:
          return typeof payload === "string" || isObject(payload);
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          return Array.isArray(payload);
      }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
        this.reconstructor = null;
      }
    }
  };
  var BinaryReconstructor = class {
    constructor(packet) {
      this.packet = packet;
      this.buffers = [];
      this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) {
        const packet = reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
      this.reconPack = null;
      this.buffers = [];
    }
  };

  // ../../node_modules/.pnpm/socket.io-client@4.8.1/node_modules/socket.io-client/build/esm/on.js
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }

  // ../../node_modules/.pnpm/socket.io-client@4.8.1/node_modules/socket.io-client/build/esm/socket.js
  var RESERVED_EVENTS2 = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1
  });
  var Socket2 = class extends Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
      super();
      this.connected = false;
      this.recovered = false;
      this.receiveBuffer = [];
      this.sendBuffer = [];
      this._queue = [];
      this._queueSeq = 0;
      this.ids = 0;
      this.acks = {};
      this.flags = {};
      this.io = io;
      this.nsp = nsp;
      if (opts && opts.auth) {
        this.auth = opts.auth;
      }
      this._opts = Object.assign({}, opts);
      if (this.io._autoConnect)
        this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
      return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
      if (this.subs)
        return;
      const io = this.io;
      this.subs = [
        on(io, "open", this.onopen.bind(this)),
        on(io, "packet", this.onpacket.bind(this)),
        on(io, "error", this.onerror.bind(this)),
        on(io, "close", this.onclose.bind(this))
      ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
      return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
      if (this.connected)
        return this;
      this.subEvents();
      if (!this.io["_reconnecting"])
        this.io.open();
      if ("open" === this.io._readyState)
        this.onopen();
      return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
      return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
      var _a, _b, _c;
      if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
        throw new Error('"' + ev.toString() + '" is a reserved event name');
      }
      args.unshift(ev);
      if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
        this._addToQueue(args);
        return this;
      }
      const packet = {
        type: PacketType.EVENT,
        data: args
      };
      packet.options = {};
      packet.options.compress = this.flags.compress !== false;
      if ("function" === typeof args[args.length - 1]) {
        const id = this.ids++;
        const ack = args.pop();
        this._registerAckCallback(id, ack);
        packet.id = id;
      }
      const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
      const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
      const discardPacket = this.flags.volatile && !isTransportWritable;
      if (discardPacket) {
      } else if (isConnected) {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      } else {
        this.sendBuffer.push(packet);
      }
      this.flags = {};
      return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
      var _a;
      const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
      if (timeout === void 0) {
        this.acks[id] = ack;
        return;
      }
      const timer = this.io.setTimeoutFn(() => {
        delete this.acks[id];
        for (let i = 0; i < this.sendBuffer.length; i++) {
          if (this.sendBuffer[i].id === id) {
            this.sendBuffer.splice(i, 1);
          }
        }
        ack.call(this, new Error("operation has timed out"));
      }, timeout);
      const fn = (...args) => {
        this.io.clearTimeoutFn(timer);
        ack.apply(this, args);
      };
      fn.withError = true;
      this.acks[id] = fn;
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
      return new Promise((resolve, reject) => {
        const fn = (arg1, arg2) => {
          return arg1 ? reject(arg1) : resolve(arg2);
        };
        fn.withError = true;
        args.push(fn);
        this.emit(ev, ...args);
      });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
      let ack;
      if (typeof args[args.length - 1] === "function") {
        ack = args.pop();
      }
      const packet = {
        id: this._queueSeq++,
        tryCount: 0,
        pending: false,
        args,
        flags: Object.assign({ fromQueue: true }, this.flags)
      };
      args.push((err, ...responseArgs) => {
        if (packet !== this._queue[0]) {
          return;
        }
        const hasError = err !== null;
        if (hasError) {
          if (packet.tryCount > this._opts.retries) {
            this._queue.shift();
            if (ack) {
              ack(err);
            }
          }
        } else {
          this._queue.shift();
          if (ack) {
            ack(null, ...responseArgs);
          }
        }
        packet.pending = false;
        return this._drainQueue();
      });
      this._queue.push(packet);
      this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
      if (!this.connected || this._queue.length === 0) {
        return;
      }
      const packet = this._queue[0];
      if (packet.pending && !force) {
        return;
      }
      packet.pending = true;
      packet.tryCount++;
      this.flags = packet.flags;
      this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
      packet.nsp = this.nsp;
      this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
      if (typeof this.auth == "function") {
        this.auth((data) => {
          this._sendConnectPacket(data);
        });
      } else {
        this._sendConnectPacket(this.auth);
      }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
      this.packet({
        type: PacketType.CONNECT,
        data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
      });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
      if (!this.connected) {
        this.emitReserved("connect_error", err);
      }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
      this.connected = false;
      delete this.id;
      this.emitReserved("disconnect", reason, description);
      this._clearAcks();
    }
    /**
     * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
     * the server.
     *
     * @private
     */
    _clearAcks() {
      Object.keys(this.acks).forEach((id) => {
        const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
        if (!isBuffered) {
          const ack = this.acks[id];
          delete this.acks[id];
          if (ack.withError) {
            ack.call(this, new Error("socket has been disconnected"));
          }
        }
      });
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
      const sameNamespace = packet.nsp === this.nsp;
      if (!sameNamespace)
        return;
      switch (packet.type) {
        case PacketType.CONNECT:
          if (packet.data && packet.data.sid) {
            this.onconnect(packet.data.sid, packet.data.pid);
          } else {
            this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          }
          break;
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          this.onevent(packet);
          break;
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          this.onack(packet);
          break;
        case PacketType.DISCONNECT:
          this.ondisconnect();
          break;
        case PacketType.CONNECT_ERROR:
          this.destroy();
          const err = new Error(packet.data.message);
          err.data = packet.data.data;
          this.emitReserved("connect_error", err);
          break;
      }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
      const args = packet.data || [];
      if (null != packet.id) {
        args.push(this.ack(packet.id));
      }
      if (this.connected) {
        this.emitEvent(args);
      } else {
        this.receiveBuffer.push(Object.freeze(args));
      }
    }
    emitEvent(args) {
      if (this._anyListeners && this._anyListeners.length) {
        const listeners = this._anyListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, args);
        }
      }
      super.emit.apply(this, args);
      if (this._pid && args.length && typeof args[args.length - 1] === "string") {
        this._lastOffset = args[args.length - 1];
      }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
      const self2 = this;
      let sent = false;
      return function(...args) {
        if (sent)
          return;
        sent = true;
        self2.packet({
          type: PacketType.ACK,
          id,
          data: args
        });
      };
    }
    /**
     * Called upon a server acknowledgement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
      const ack = this.acks[packet.id];
      if (typeof ack !== "function") {
        return;
      }
      delete this.acks[packet.id];
      if (ack.withError) {
        packet.data.unshift(null);
      }
      ack.apply(this, packet.data);
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
      this.id = id;
      this.recovered = pid && this._pid === pid;
      this._pid = pid;
      this.connected = true;
      this.emitBuffered();
      this.emitReserved("connect");
      this._drainQueue(true);
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
      this.receiveBuffer.forEach((args) => this.emitEvent(args));
      this.receiveBuffer = [];
      this.sendBuffer.forEach((packet) => {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      });
      this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
      this.destroy();
      this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
      if (this.subs) {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs = void 0;
      }
      this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
      if (this.connected) {
        this.packet({ type: PacketType.DISCONNECT });
      }
      this.destroy();
      if (this.connected) {
        this.onclose("io client disconnect");
      }
      return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
      return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
      this.flags.compress = compress;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
      this.flags.volatile = true;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
      this.flags.timeout = timeout;
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
      if (!this._anyListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
      return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
      if (!this._anyOutgoingListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyOutgoingListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyOutgoingListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
      return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
      if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
        const listeners = this._anyOutgoingListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, packet.data);
        }
      }
    }
  };

  // ../../node_modules/.pnpm/socket.io-client@4.8.1/node_modules/socket.io-client/build/esm/contrib/backo2.js
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 1e4;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  Backoff.prototype.duration = function() {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
  };
  Backoff.prototype.reset = function() {
    this.attempts = 0;
  };
  Backoff.prototype.setMin = function(min) {
    this.ms = min;
  };
  Backoff.prototype.setMax = function(max) {
    this.max = max;
  };
  Backoff.prototype.setJitter = function(jitter) {
    this.jitter = jitter;
  };

  // ../../node_modules/.pnpm/socket.io-client@4.8.1/node_modules/socket.io-client/build/esm/manager.js
  var Manager = class extends Emitter {
    constructor(uri, opts) {
      var _a;
      super();
      this.nsps = {};
      this.subs = [];
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = void 0;
      }
      opts = opts || {};
      opts.path = opts.path || "/socket.io";
      this.opts = opts;
      installTimerFunctions(this, opts);
      this.reconnection(opts.reconnection !== false);
      this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
      this.reconnectionDelay(opts.reconnectionDelay || 1e3);
      this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
      this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
      this.backoff = new Backoff({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor()
      });
      this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
      this._readyState = "closed";
      this.uri = uri;
      const _parser = opts.parser || esm_exports;
      this.encoder = new _parser.Encoder();
      this.decoder = new _parser.Decoder();
      this._autoConnect = opts.autoConnect !== false;
      if (this._autoConnect)
        this.open();
    }
    reconnection(v) {
      if (!arguments.length)
        return this._reconnection;
      this._reconnection = !!v;
      if (!v) {
        this.skipReconnect = true;
      }
      return this;
    }
    reconnectionAttempts(v) {
      if (v === void 0)
        return this._reconnectionAttempts;
      this._reconnectionAttempts = v;
      return this;
    }
    reconnectionDelay(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelay;
      this._reconnectionDelay = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
      return this;
    }
    randomizationFactor(v) {
      var _a;
      if (v === void 0)
        return this._randomizationFactor;
      this._randomizationFactor = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
      return this;
    }
    reconnectionDelayMax(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelayMax;
      this._reconnectionDelayMax = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
      return this;
    }
    timeout(v) {
      if (!arguments.length)
        return this._timeout;
      this._timeout = v;
      return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
      if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
        this.reconnect();
      }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
      if (~this._readyState.indexOf("open"))
        return this;
      this.engine = new Socket(this.uri, this.opts);
      const socket = this.engine;
      const self2 = this;
      this._readyState = "opening";
      this.skipReconnect = false;
      const openSubDestroy = on(socket, "open", function() {
        self2.onopen();
        fn && fn();
      });
      const onError = (err) => {
        this.cleanup();
        this._readyState = "closed";
        this.emitReserved("error", err);
        if (fn) {
          fn(err);
        } else {
          this.maybeReconnectOnOpen();
        }
      };
      const errorSub = on(socket, "error", onError);
      if (false !== this._timeout) {
        const timeout = this._timeout;
        const timer = this.setTimeoutFn(() => {
          openSubDestroy();
          onError(new Error("timeout"));
          socket.close();
        }, timeout);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
      this.subs.push(openSubDestroy);
      this.subs.push(errorSub);
      return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
      return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
      this.cleanup();
      this._readyState = "open";
      this.emitReserved("open");
      const socket = this.engine;
      this.subs.push(
        on(socket, "ping", this.onping.bind(this)),
        on(socket, "data", this.ondata.bind(this)),
        on(socket, "error", this.onerror.bind(this)),
        on(socket, "close", this.onclose.bind(this)),
        // @ts-ignore
        on(this.decoder, "decoded", this.ondecoded.bind(this))
      );
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
      this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
      try {
        this.decoder.add(data);
      } catch (e) {
        this.onclose("parse error", e);
      }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
      nextTick(() => {
        this.emitReserved("packet", packet);
      }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
      this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
      let socket = this.nsps[nsp];
      if (!socket) {
        socket = new Socket2(this, nsp, opts);
        this.nsps[nsp] = socket;
      } else if (this._autoConnect && !socket.active) {
        socket.connect();
      }
      return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
      const nsps = Object.keys(this.nsps);
      for (const nsp of nsps) {
        const socket2 = this.nsps[nsp];
        if (socket2.active) {
          return;
        }
      }
      this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
      const encodedPackets = this.encoder.encode(packet);
      for (let i = 0; i < encodedPackets.length; i++) {
        this.engine.write(encodedPackets[i], packet.options);
      }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs.length = 0;
      this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
      this.skipReconnect = true;
      this._reconnecting = false;
      this.onclose("forced close");
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
      return this._close();
    }
    /**
     * Called when:
     *
     * - the low-level engine is closed
     * - the parser encountered a badly formatted packet
     * - all sockets are disconnected
     *
     * @private
     */
    onclose(reason, description) {
      var _a;
      this.cleanup();
      (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
      this.backoff.reset();
      this._readyState = "closed";
      this.emitReserved("close", reason, description);
      if (this._reconnection && !this.skipReconnect) {
        this.reconnect();
      }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
      if (this._reconnecting || this.skipReconnect)
        return this;
      const self2 = this;
      if (this.backoff.attempts >= this._reconnectionAttempts) {
        this.backoff.reset();
        this.emitReserved("reconnect_failed");
        this._reconnecting = false;
      } else {
        const delay = this.backoff.duration();
        this._reconnecting = true;
        const timer = this.setTimeoutFn(() => {
          if (self2.skipReconnect)
            return;
          this.emitReserved("reconnect_attempt", self2.backoff.attempts);
          if (self2.skipReconnect)
            return;
          self2.open((err) => {
            if (err) {
              self2._reconnecting = false;
              self2.reconnect();
              this.emitReserved("reconnect_error", err);
            } else {
              self2.onreconnect();
            }
          });
        }, delay);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
      const attempt = this.backoff.attempts;
      this._reconnecting = false;
      this.backoff.reset();
      this.emitReserved("reconnect", attempt);
    }
  };

  // ../../node_modules/.pnpm/socket.io-client@4.8.1/node_modules/socket.io-client/build/esm/index.js
  var cache2 = {};
  function lookup2(uri, opts) {
    if (typeof uri === "object") {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache2[id] && path in cache2[id]["nsps"];
    const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    let io;
    if (newConnection) {
      io = new Manager(source, opts);
    } else {
      if (!cache2[id]) {
        cache2[id] = new Manager(source, opts);
      }
      io = cache2[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
  }
  Object.assign(lookup2, {
    Manager,
    Socket: Socket2,
    io: lookup2,
    connect: lookup2
  });

  // ../client/dist/utils.js
  function passTime(ms) {
    return new Promise((res, rej) => {
      setTimeout(res, ms);
    });
  }
  function setEqual(set1, set2) {
    return set1.symmetricDifference(set2).size === 0;
  }
  async function getAuthToken(data) {
    try {
      const endpoint = `${data.url}/auth`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      console.log("Received token:", result.token);
      return result.token;
    } catch (error) {
      console.error("Request failed:", error);
      return null;
    }
  }

  // ../client/dist/client/messageLog.js
  var MessageKey = class {
    turn;
    event;
    sender;
    recipient;
    constructor(turn, event, sender, recipient) {
      this.turn = turn;
      this.event = event;
      this.sender = sender;
      this.recipient = recipient;
    }
    toString() {
      return `${this.turn}-${this.event}-${this.sender}-${this.recipient}`;
    }
    static fromMsg(msg) {
      return new this(msg.turn, msg.event, msg.sender, msg.to);
    }
  };
  var MessageLog = class {
    log;
    constructor() {
      this.log = {};
    }
    register(msg) {
      const msgKey = MessageKey.fromMsg(msg);
      this.log[msgKey.toString()] = msg;
    }
    find(turn, event, sender, to) {
      const msgKey = new MessageKey(turn, event, sender, to);
      return this.log[msgKey.toString()];
    }
    clear(msg) {
      const msgKey = MessageKey.fromMsg(msg);
      delete this.log[msgKey.toString()];
    }
  };

  // ../client/dist/client/sockets/socketManager.js
  var TIMEOUT = 3e3;
  var SocketManager = class extends import_index.default {
    game;
    lobby;
    gameId;
    token;
    _ready;
    msgLog;
    constructor(options) {
      super();
      this.game = lookup2(`${options.serverUrl}/game/${options.gameId}`, {
        auth: {
          token: options.token
        }
      });
      this.lobby = lookup2(options.serverUrl, {
        auth: {
          token: options.token
        }
      });
      this.token = options.token;
      this.gameId = options.gameId;
      this._ready = false;
      this.msgLog = new MessageLog();
      const self2 = this;
      this.game.on(GameMsg.TURN_END, (ack) => {
        self2.emit(GameMsg.TURN_END);
        ack();
      });
      this.game.on(GameMsg.TURN_START, (turnInfo, ack) => {
        self2.emit(GameMsg.TURN_START, turnInfo);
        ack();
      });
      this.game.on(GameMsg.QUERY, (msg, ack) => {
        this.msgLog.register(msg);
        ack();
      });
      this.game.on(GameMsg.ANSWER, (msg, ack) => {
        this.msgLog.register(msg);
        ack();
      });
      this.game.on(GameMsg.UPDATE, (msg, ack) => {
        this.msgLog.register(msg);
        ack();
      });
      this.game.on(GameMsg.REPORT, (msg, ack) => {
        this.msgLog.register(msg);
        ack();
      });
    }
    // emitWithAck(event: string, ...args: any[]) {
    //   return new Promise<void>((res, rej) => {
    //     const receptionChannel = nanoid();
    //     this.once(receptionChannel, () => res())
    //     this.emit(event, { receptionChannel }, ...args)
    //   })
    // }
    // addListenerForAck(event: string, cb: (...args: any[]) => void) {
    //   this.addListener(event, ({ receptionChannel }, ...args) => {
    //     cb(args);
    //     this.emit(receptionChannel);
    //   })
    // }
    get sender() {
      return this.game.id;
    }
    _lobbyReady() {
      return this.lobby.connected;
    }
    _gameReady() {
      return this.game.connected;
    }
    async socketsReady() {
      while (!this._ready) {
        await passTime(100);
        if (this._lobbyReady() && this._gameReady()) {
          this._ready = true;
        }
      }
    }
    lookLogForEvent(turn, event, fromTo) {
      return Array.from(fromTo.values().map((s) => {
        return this.msgLog.find(turn, event, s[0], s[1]);
      }).filter((x) => x !== void 0));
    }
    lookLogForQueries(turn, fromTo) {
      return this.lookLogForEvent(turn, GameMsg.QUERY, fromTo);
    }
    lookLogForAnswer(turn, fromTo) {
      return this.lookLogForEvent(turn, GameMsg.ANSWER, fromTo);
    }
    lookLogForUpdates(turn, fromTo) {
      return this.lookLogForEvent(turn, GameMsg.UPDATE, fromTo);
    }
    lookLogForReport(turn, from) {
      return this.msgLog.find(turn, GameMsg.REPORT, from);
    }
    async advertisePlayerAsReady() {
      await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.READY);
    }
    async broadcastAnswer(turn, to, payload) {
      const answerMsg = {
        turn,
        event: GameMsg.ANSWER,
        sender: this.sender,
        to,
        payload
      };
      await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.ANSWER, answerMsg);
    }
    async broadcastQuery(turn, to, payload) {
      const queryMsg = {
        turn,
        event: GameMsg.QUERY,
        sender: this.sender,
        to,
        payload
      };
      await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.QUERY, queryMsg);
    }
    async broadcastUpdate(turn, to, payload) {
      const updateMsg = {
        turn,
        event: GameMsg.UPDATE,
        sender: this.sender,
        to,
        payload
      };
      await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.UPDATE, updateMsg);
    }
    async broadcastReport(turn, payload) {
      const reportMsg = {
        turn,
        event: GameMsg.REPORT,
        sender: this.sender,
        payload
      };
      await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.REPORT, reportMsg);
    }
    async waitForQuery(turn, activePlayer, players) {
      const playerSet = new Set(players);
      const queries = /* @__PURE__ */ new Map();
      return new Promise(async (res, rej) => {
        setTimeout(rej, TIMEOUT);
        while (true) {
          await passTime(100);
          const missingPlayers = new Set(playerSet.difference(new Set(queries.keys())).values().map((from) => [from, activePlayer]));
          const loggedMsgs = this.lookLogForQueries(turn, missingPlayers);
          loggedMsgs.forEach((msg) => queries.set(msg.sender, msg.payload));
          const enough = setEqual(playerSet, new Set(queries.keys()));
          if (!enough) {
            await passTime(100);
          } else {
            break;
          }
        }
        res(queries);
      });
    }
    async waitForAnswer(turn, activePlayer, players) {
      const playerSet = new Set(players);
      const answers = /* @__PURE__ */ new Map();
      return new Promise(async (res, rej) => {
        setTimeout(rej, TIMEOUT);
        while (true) {
          const missingPlayers = new Set(playerSet.difference(new Set(answers.keys())).values().map((from) => [activePlayer, from]));
          const loggedMsgs = this.lookLogForAnswer(turn, missingPlayers);
          loggedMsgs.forEach((msg) => answers.set(msg.to, msg.payload));
          const enough = setEqual(playerSet, new Set(answers.keys()));
          if (!enough) {
            await passTime(100);
          } else {
            break;
          }
        }
        res(answers);
      });
    }
    async waitForUpdates(turn, activePlayer, players) {
      const playerSet = new Set(players);
      const updates = /* @__PURE__ */ new Map();
      return new Promise(async (res, rej) => {
        setTimeout(rej, TIMEOUT);
        while (true) {
          await passTime(100);
          const missingPlayers = new Set(playerSet.difference(new Set(updates.keys())).values().map((from) => [from, activePlayer]));
          const loggedMsgs = this.lookLogForUpdates(turn, missingPlayers);
          loggedMsgs.forEach((msg) => updates.set(msg.sender, msg.payload));
          let enough = setEqual(playerSet, new Set(updates.keys()));
          if (!enough) {
            await passTime(100);
          } else {
            break;
          }
        }
        res(updates);
      });
    }
    async waitForReport(turn, from) {
      let report = void 0;
      return new Promise(async (res, rej) => {
        setTimeout(rej, TIMEOUT);
        while (report === void 0) {
          await passTime(100);
          const reportMsg = this.lookLogForReport(turn, from);
          report = reportMsg?.payload;
        }
        res(report);
      });
    }
    async waitForGameStartEvent() {
      return new Promise((res, rej) => {
        this.game.once(GameMsg.STARTED, (ack) => {
          ack();
          res();
        });
      });
    }
    async waitForTurnStartEvent() {
      return new Promise((res, rej) => {
        this.game.once(GameMsg.TURN_START, (data, ack) => {
          ack();
          res(data);
        });
      });
    }
  };

  // ../client/dist/client/init.js
  async function initClient(name, url2, gameId) {
    const data = { name, url: url2 };
    const newToken = await getAuthToken(data);
    if (newToken) {
      const sockets = new SocketManager({
        serverUrl: url2,
        token: newToken,
        gameId
      });
      await sockets.socketsReady();
      const client = new GameClient(sockets.token, sockets);
      await client.play();
    } else {
      console.log("Could not get user token from gamemaster in /auth");
    }
  }

  // src/script.ts
  try {
    initClient("web-gamer", "http://0.0.0.0:2448", "0");
  } catch (e) {
    console.error("Client failed to initialize");
  }
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid");
    const log2 = document.getElementById("log");
    const moveBtn = document.getElementById("move-btn");
    const trapBtn = document.getElementById("trap-btn");
    const errorMessage = document.getElementById("error-message");
    const tutorial = document.getElementById("tutorial");
    let agents = [];
    let turn = 0;
    const maxAgents = 4;
    let selectedAgentCell = null;
    let actionMode = null;
    function initializeGrid() {
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i.toString();
        grid.appendChild(cell);
      }
    }
    initializeGrid();
    updateTutorial();
    logMessage("GAME STARTED");
    moveBtn.addEventListener("click", () => {
      if (turn > 0) {
        actionMode = "move";
        moveBtn.classList.add("active");
        trapBtn.classList.remove("active");
        logMessage("MOVE SELECTED");
        updateTutorial();
      }
    });
    trapBtn.addEventListener("click", () => {
      if (turn > 0) {
        actionMode = "trap";
        trapBtn.classList.add("active");
        moveBtn.classList.remove("active");
        logMessage("TRAP SELECTED");
        updateTutorial();
      }
    });
    grid.addEventListener("click", (e) => {
      const target = e.target;
      const cell = target.className === "cell" ? target : target.closest(".cell");
      if (!cell) return;
      const index = parseInt(cell.dataset.index);
      const row = Math.floor(index / 4);
      const col = index % 4;
      if (turn === 0) {
        if (agents.length < maxAgents) {
          const agent = document.createElement("div");
          agent.className = "agent";
          const agentId = agents.length + 1;
          agent.textContent = `A${agentId}`;
          cell.appendChild(agent);
          agents.push({ id: agentId, row, col });
          logMessage(`AGENT A${agentId} DEPLOYED TO (${row + 1},${col + 1})`);
          updateTutorial();
          if (agents.length === maxAgents) {
            turn = 1;
            logMessage("DEPLOYMENT COMPLETE - TURN 1");
            updateTutorial();
          }
        }
      } else if (turn > 0 && actionMode) {
        const agentsInCell = agents.filter((a) => a.row === row && a.col === col);
        if (agentsInCell.length > 0 && !selectedAgentCell) {
          selectedAgentCell = { row, col };
          cell.classList.add("selected");
          logMessage(`CELL (${row + 1},${col + 1}) SELECTED`);
          highlightPossibleCells(row, col);
          updateTutorial();
        } else if (selectedAgentCell) {
          if (actionMode === "move") {
            moveAgent(row, col);
          } else if (actionMode === "trap") {
            deployTrap(row, col);
          }
        }
      } else if (turn > 0 && !actionMode) {
        showError("SELECT MOVE OR TRAP FIRST");
      }
    });
    function highlightPossibleCells(row, col) {
      clearPossibleHighlights();
      const directions = [
        { r: -1, c: 0 },
        // up
        { r: 1, c: 0 },
        // down
        { r: 0, c: -1 },
        // left
        { r: 0, c: 1 }
        // right
      ];
      directions.forEach((dir) => {
        const newRow = row + dir.r;
        const newCol = col + dir.c;
        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
          const index = newRow * 4 + newCol;
          const cell = grid.children[index];
          cell.classList.add("possible");
        }
      });
    }
    function clearPossibleHighlights() {
      const cells = document.querySelectorAll(".cell.possible");
      cells.forEach((cell) => cell.classList.remove("possible"));
    }
    function moveAgent(newRow, newCol) {
      const { row: oldRow, col: oldCol } = selectedAgentCell;
      const rowDiff = Math.abs(newRow - oldRow);
      const colDiff = Math.abs(newCol - oldCol);
      if (rowDiff === 1 && colDiff === 0 || rowDiff === 0 && colDiff === 1) {
        const agentToMove = agents.find((a) => a.row === oldRow && a.col === oldCol);
        if (agentToMove) {
          const oldCell = grid.children[oldRow * 4 + oldCol];
          const newCell = grid.children[newRow * 4 + newCol];
          const agentElement = oldCell.querySelector(".agent");
          newCell.appendChild(agentElement);
          agentToMove.row = newRow;
          agentToMove.col = newCol;
          logMessage(`AGENT A${agentToMove.id} MOVED TO (${newRow + 1},${newCol + 1})`);
          endTurn();
        }
      }
    }
    function deployTrap(newRow, newCol) {
      const { row: oldRow, col: oldCol } = selectedAgentCell;
      const rowDiff = Math.abs(newRow - oldRow);
      const colDiff = Math.abs(newCol - oldCol);
      if (rowDiff === 1 && colDiff === 0 || rowDiff === 0 && colDiff === 1) {
        const newCell = grid.children[newRow * 4 + newCol];
        const trap = document.createElement("div");
        trap.className = "trap";
        trap.textContent = "\u{1F4A3}";
        newCell.appendChild(trap);
        logMessage(`TRAP DEPLOYED TO (${newRow + 1},${newCol + 1})`);
        endTurn();
      }
    }
    function endTurn() {
      if (selectedAgentCell) {
        const { row, col } = selectedAgentCell;
        const oldCell = grid.children[row * 4 + col];
        oldCell.classList.remove("selected");
        selectedAgentCell = null;
      }
      clearPossibleHighlights();
      actionMode = null;
      moveBtn.classList.remove("active");
      trapBtn.classList.remove("active");
      turn++;
      logMessage(`TURN ${turn}`);
      updateTutorial();
    }
    function logMessage(message) {
      const p = document.createElement("p");
      p.textContent = `> ${message}`;
      log2.appendChild(p);
      log2.scrollTop = log2.scrollHeight;
    }
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
      errorMessage.classList.add("active");
      setTimeout(() => {
        errorMessage.style.display = "none";
        errorMessage.classList.remove("active");
      }, 2e3);
    }
    function updateTutorial() {
      if (turn === 0) {
        const remaining = maxAgents - agents.length;
        tutorial.textContent = `DEPLOY ${remaining} AGENTS BY CLICKING ANY CELL`;
      } else if (turn > 0) {
        if (!actionMode && !selectedAgentCell) {
          tutorial.textContent = "SELECT MOVE OR TRAP";
        } else if (actionMode === "move" && !selectedAgentCell) {
          tutorial.textContent = "CLICK AN AGENT CELL TO MOVE";
        } else if (actionMode === "move" && selectedAgentCell) {
          tutorial.textContent = "CLICK AN ADJACENT CELL TO MOVE";
        } else if (actionMode === "trap" && !selectedAgentCell) {
          tutorial.textContent = "CLICK AN AGENT CELL TO DEPLOY TRAP";
        } else if (actionMode === "trap" && selectedAgentCell) {
          tutorial.textContent = "CLICK AN ADJACENT CELL TO DEPLOY TRAP";
        }
      }
    }
  });
})();
//# sourceMappingURL=out.js.map

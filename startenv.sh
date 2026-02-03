#!/bin/bash

###############################################################################
# Mockto Development Environment Manager
# Controls all development services with obscure ports
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Obscure ports configuration
DEV_PORT=13579
PREVIEW_PORT=24680
TEST_UI_PORT=9321

# PID file locations
PID_DIR=".pids"
mkdir -p "$PID_DIR"

DEV_PID_FILE="$PID_DIR/dev.pid"
PREVIEW_PID_FILE="$PID_DIR/preview.pid"
TEST_UI_PID_FILE="$PID_DIR/test-ui.pid"

# Log locations
LOG_DIR=".logs"
mkdir -p "$LOG_DIR"

###############################################################################
# Utility Functions
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

###############################################################################
# Service Status Functions
###############################################################################

is_dev_running() {
    [ -f "$DEV_PID_FILE" ] && kill -0 "$(cat "$DEV_PID_FILE")" 2>/dev/null
}

is_preview_running() {
    [ -f "$PREVIEW_PID_FILE" ] && kill -0 "$(cat "$PREVIEW_PID_FILE")" 2>/dev/null
}

is_test_ui_running() {
    [ -f "$TEST_UI_PID_FILE" ] && kill -0 "$(cat "$TEST_UI_PID_FILE")" 2>/dev/null
}

print_status() {
    print_header "Service Status"

    if is_dev_running; then
        local pid=$(cat "$DEV_PID_FILE")
        log_success "Dev Server:     RUNNING (PID: $pid, Port: $DEV_PORT)"
    else
        log_warning "Dev Server:     STOPPED"
    fi

    if is_preview_running; then
        local pid=$(cat "$PREVIEW_PID_FILE")
        log_success "Preview Server: RUNNING (PID: $pid, Port: $PREVIEW_PORT)"
    else
        log_warning "Preview Server: STOPPED"
    fi

    if is_test_ui_running; then
        local pid=$(cat "$TEST_UI_PID_FILE")
        log_success "Test UI:         RUNNING (PID: $pid, Port: $TEST_UI_PORT)"
    else
        log_warning "Test UI:         STOPPED"
    fi

    echo ""
}

###############################################################################
# Service Control Functions
###############################################################################

start_dev() {
    if is_dev_running; then
        log_warning "Dev server is already running on port $DEV_PORT"
        return 0
    fi

    log_info "Starting development server on port $DEV_PORT..."
    nohup npm run dev > "$LOG_DIR/dev.log" 2>&1 &
    local pid=$!
    echo $pid > "$DEV_PID_FILE"

    # Wait for server to start
    local max_wait=10
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if kill -0 $pid 2>/dev/null; then
            log_success "Dev server started (PID: $pid)"
            echo ""
            log_info "Access the app at: ${GREEN}http://localhost:$DEV_PORT${NC}"
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done

    log_error "Failed to start dev server"
    return 1
}

start_preview() {
    if is_preview_running; then
        log_warning "Preview server is already running on port $PREVIEW_PORT"
        return 0
    fi

    log_info "Starting preview server on port $PREVIEW_PORT..."
    nohup npm run preview > "$LOG_DIR/preview.log" 2>&1 &
    local pid=$!
    echo $pid > "$PREVIEW_PID_FILE"

    sleep 2

    if kill -0 $pid 2>/dev/null; then
        log_success "Preview server started (PID: $pid)"
        echo ""
        log_info "Access preview at: ${GREEN}http://localhost:$PREVIEW_PORT${NC}"
        return 0
    else
        log_error "Failed to start preview server (build may be required)"
        return 1
    fi
}

start_test_ui() {
    if is_test_ui_running; then
        log_warning "Test UI is already running on port $TEST_UI_PORT"
        return 0
    fi

    log_info "Starting Vitest UI on port $TEST_UI_PORT..."
    nohup npm run test:ui -- --port $TEST_UI_PORT > "$LOG_DIR/test-ui.log" 2>&1 &
    local pid=$!
    echo $pid > "$TEST_UI_PID_FILE"

    sleep 2

    if kill -0 $pid 2>/dev/null; then
        log_success "Test UI started (PID: $pid)"
        echo ""
        log_info "Access test UI at: ${GREEN}http://localhost:$TEST_UI_PORT${NC}"
        return 0
    else
        log_error "Failed to start test UI"
        return 1
    fi
}

stop_dev() {
    if ! is_dev_running; then
        log_warning "Dev server is not running"
        [ -f "$DEV_PID_FILE" ] && rm -f "$DEV_PID_FILE"
        return 0
    fi

    local pid=$(cat "$DEV_PID_FILE")
    log_info "Stopping dev server (PID: $pid)..."
    kill $pid 2>/dev/null || true
    rm -f "$DEV_PID_FILE"

    # Wait for process to terminate
    local max_wait=5
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if ! kill -0 $pid 2>/dev/null; then
            log_success "Dev server stopped"
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done

    # Force kill if still running
    kill -9 $pid 2>/dev/null || true
    log_success "Dev server force stopped"
}

stop_preview() {
    if ! is_preview_running; then
        log_warning "Preview server is not running"
        [ -f "$PREVIEW_PID_FILE" ] && rm -f "$PREVIEW_PID_FILE"
        return 0
    fi

    local pid=$(cat "$PREVIEW_PID_FILE")
    log_info "Stopping preview server (PID: $pid)..."
    kill $pid 2>/dev/null || true
    rm -f "$PREVIEW_PID_FILE"

    sleep 1
    log_success "Preview server stopped"
}

stop_test_ui() {
    if ! is_test_ui_running; then
        log_warning "Test UI is not running"
        [ -f "$TEST_UI_PID_FILE" ] && rm -f "$TEST_UI_PID_FILE"
        return 0
    fi

    local pid=$(cat "$TEST_UI_PID_FILE")
    log_info "Stopping Test UI (PID: $pid)..."
    kill $pid 2>/dev/null || true
    rm -f "$TEST_UI_PID_FILE"

    sleep 1
    log_success "Test UI stopped"
}

###############################################################################
# Main Commands
###############################################################################

start() {
    print_header "Starting Development Environment"

    start_dev
    echo ""

    print_status
}

stop() {
    print_header "Stopping Development Environment"

    stop_dev
    stop_preview
    stop_test_ui

    echo ""
    log_success "All services stopped"
}

restart() {
    print_header "Restarting Development Environment"

    stop_dev
    sleep 1
    start_dev

    echo ""
    print_status
}

start_all() {
    print_header "Starting All Services"

    start_dev
    start_test_ui

    echo ""
    print_status
}

logs() {
    local service="$1"

    case "$service" in
        dev)
            [ -f "$LOG_DIR/dev.log" ] && tail -f "$LOG_DIR/dev.log"
            ;;
        preview)
            [ -f "$LOG_DIR/preview.log" ] && tail -f "$LOG_DIR/preview.log"
            ;;
        test|test-ui)
            [ -f "$LOG_DIR/test-ui.log" ] && tail -f "$LOG_DIR/test-ui.log"
            ;;
        *)
            echo "Usage: $0 logs [dev|preview|test]"
            return 1
            ;;
    esac
}

show_help() {
    cat << EOF
${BLUE}Mockto Development Environment Manager${NC}

${YELLOW}USAGE:${NC}
    $0 <command> [options]

${YELLOW}COMMANDS:${NC}
    ${GREEN}start${NC}              Start development server
    ${GREEN}start-all${NC}          Start all services (dev + test UI)
    ${GREEN}stop${NC}               Stop all services
    ${GREEN}restart${NC}            Restart development server
    ${GREEN}status${NC}             Show service status
    ${GREEN}logs${NC} [service]     Follow logs for a service
                            Options: dev, preview, test

${YELLOW}SERVICE-LEVEL COMMANDS:${NC}
    ${GREEN}start-dev${NC}          Start only dev server
    ${GREEN}start-preview${NC}      Start only preview server
    ${GREEN}start-test-ui${NC}      Start only test UI
    ${GREEN}stop-dev${NC}           Stop dev server
    ${GREEN}stop-preview${NC}       Stop preview server
    ${GREEN}stop-test-ui${NC}       Stop test UI

${YELLOW}PORTS:${NC}
    Dev Server:     ${GREEN}$DEV_PORT${NC}
    Preview Server: ${GREEN}$PREVIEW_PORT${NC}
    Test UI:        ${GREEN}$TEST_UI_PORT${NC}

${YELLOW}EXAMPLES:${NC}
    $0 start               # Start dev server
    $0 start-all           # Start all services
    $0 status              # Show status
    $0 logs dev            # Follow dev server logs
    $0 stop                # Stop all services

EOF
}

###############################################################################
# Main Entry Point
###############################################################################

main() {
    local command="$1"
    shift || true

    case "$command" in
        start)
            start
            ;;
        start-all)
            start_all
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            print_status
            ;;
        logs)
            logs "$1"
            ;;
        start-dev)
            start_dev
            ;;
        start-preview)
            start_preview
            ;;
        start-test-ui)
            start_test_ui
            ;;
        stop-dev)
            stop_dev
            ;;
        stop-preview)
            stop_preview
            ;;
        stop-test-ui)
            stop_test_ui
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"

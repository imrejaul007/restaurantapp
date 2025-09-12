"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApiClient = useApiClient;
exports.useAuth = useAuth;
exports.useRestaurants = useRestaurants;
exports.useOrders = useOrders;
exports.useSocket = useSocket;
exports.useOrderUpdates = useOrderUpdates;
exports.useNotifications = useNotifications;
exports.useFileUpload = useFileUpload;
exports.useSearch = useSearch;
exports.usePagination = usePagination;
exports.useTokenStorage = useTokenStorage;
const react_1 = require("react");
const api_client_1 = require("./api-client");
const socket_client_1 = require("./socket-client");
function useApiClient() {
    const [client, setClient] = (0, react_1.useState)(null);
    const [isInitialized, setIsInitialized] = (0, react_1.useState)(false);
    const initializeClient = (0, react_1.useCallback)((config) => {
        const apiClient = new api_client_1.RestaurantHubApiClient(config);
        setClient(apiClient);
        setIsInitialized(true);
        return apiClient;
    }, []);
    return {
        client,
        isInitialized,
        initializeClient,
    };
}
function useAuth() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [tokens, setTokens] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const signUp = (0, react_1.useCallback)(async (client, userData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.signUp(userData);
            setUser(response.data.user);
            setTokens(response.data.tokens);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const signIn = (0, react_1.useCallback)(async (client, credentials) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.signIn(credentials);
            setUser(response.data.user);
            setTokens(response.data.tokens);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const signOut = (0, react_1.useCallback)(async (client) => {
        try {
            setLoading(true);
            await client.signOut();
            setUser(null);
            setTokens(null);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateProfile = (0, react_1.useCallback)(async (client, userData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.updateUserProfile(userData);
            setUser(response.data);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return {
        user,
        tokens,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        updateProfile,
        setUser,
        setTokens,
    };
}
function useRestaurants() {
    const [restaurants, setRestaurants] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [pagination, setPagination] = (0, react_1.useState)(null);
    const fetchRestaurants = (0, react_1.useCallback)(async (client, params) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.getRestaurants(params);
            setRestaurants(response.data);
            setPagination(response.pagination);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const createRestaurant = (0, react_1.useCallback)(async (client, restaurantData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.createRestaurant(restaurantData);
            setRestaurants(prev => [...prev, response.data]);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateRestaurant = (0, react_1.useCallback)(async (client, id, restaurantData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.updateRestaurant(id, restaurantData);
            setRestaurants(prev => prev.map(restaurant => restaurant.id === id ? response.data : restaurant));
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const deleteRestaurant = (0, react_1.useCallback)(async (client, id) => {
        try {
            setLoading(true);
            setError(null);
            await client.deleteRestaurant(id);
            setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return {
        restaurants,
        loading,
        error,
        pagination,
        fetchRestaurants,
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        setRestaurants,
    };
}
function useOrders() {
    const [orders, setOrders] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [pagination, setPagination] = (0, react_1.useState)(null);
    const fetchOrders = (0, react_1.useCallback)(async (client, params) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.getOrders(params);
            setOrders(response.data);
            setPagination(response.pagination);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const createOrder = (0, react_1.useCallback)(async (client, orderData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.createOrder(orderData);
            setOrders(prev => [...prev, response.data]);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateOrderStatus = (0, react_1.useCallback)(async (client, id, status) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.updateOrderStatus(id, status);
            setOrders(prev => prev.map(order => order.id === id ? { ...order, status: status } : order));
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return {
        orders,
        loading,
        error,
        pagination,
        fetchOrders,
        createOrder,
        updateOrderStatus,
        setOrders,
    };
}
function useSocket() {
    const [socket, setSocket] = (0, react_1.useState)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const initializeSocket = (0, react_1.useCallback)((config) => {
        const socketClient = new socket_client_1.RestaurantHubSocketClient(config);
        socketClient.on('connected', () => {
            setIsConnected(true);
            setError(null);
        });
        socketClient.on('disconnected', () => {
            setIsConnected(false);
        });
        socketClient.on('connectionError', (err) => {
            setError(err.message);
        });
        setSocket(socketClient);
        return socketClient;
    }, []);
    const connect = (0, react_1.useCallback)(async () => {
        if (socket) {
            try {
                await socket.connect();
            }
            catch (err) {
                setError(err.message);
            }
        }
    }, [socket]);
    const disconnect = (0, react_1.useCallback)(() => {
        if (socket) {
            socket.disconnect();
        }
    }, [socket]);
    return {
        socket,
        isConnected,
        error,
        initializeSocket,
        connect,
        disconnect,
    };
}
function useOrderUpdates(orderId) {
    const [orderUpdate, setOrderUpdate] = (0, react_1.useState)(null);
    const [socket, setSocket] = (0, react_1.useState)(null);
    const subscribeToUpdates = (0, react_1.useCallback)((socketClient, orderIdParam) => {
        setSocket(socketClient);
        const handleOrderUpdate = (update) => {
            if (!orderIdParam || update.orderId === orderIdParam) {
                setOrderUpdate(update);
            }
        };
        socketClient.on('orderUpdate', handleOrderUpdate);
        socketClient.subscribeToOrderUpdates(orderIdParam);
        return () => {
            socketClient.off('orderUpdate', handleOrderUpdate);
            socketClient.unsubscribeFromOrderUpdates(orderIdParam);
        };
    }, []);
    return {
        orderUpdate,
        subscribeToUpdates,
    };
}
function useNotifications() {
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [unreadCount, setUnreadCount] = (0, react_1.useState)(0);
    const subscribeToNotifications = (0, react_1.useCallback)((socketClient) => {
        const handleNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };
        socketClient.on('notification', handleNotification);
        socketClient.subscribeToNotifications();
        return () => {
            socketClient.off('notification', handleNotification);
        };
    }, []);
    const markAsRead = (0, react_1.useCallback)((socketClient, notificationId) => {
        socketClient.markNotificationAsRead(notificationId);
        setNotifications(prev => prev.map(notification => notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);
    const markAllAsRead = (0, react_1.useCallback)((socketClient) => {
        notifications.forEach(notification => {
            if (!notification.read) {
                socketClient.markNotificationAsRead(notification.id);
            }
        });
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        setUnreadCount(0);
    }, [notifications]);
    return {
        notifications,
        unreadCount,
        subscribeToNotifications,
        markAsRead,
        markAllAsRead,
        setNotifications,
    };
}
function useFileUpload() {
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [error, setError] = (0, react_1.useState)(null);
    const uploadFile = (0, react_1.useCallback)(async (client, file, options) => {
        try {
            setUploading(true);
            setError(null);
            setProgress(0);
            const response = await client.uploadFile(file, options);
            setProgress(100);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setUploading(false);
        }
    }, []);
    return {
        uploading,
        progress,
        error,
        uploadFile,
    };
}
function useSearch() {
    const [results, setResults] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [suggestions, setSuggestions] = (0, react_1.useState)([]);
    const search = (0, react_1.useCallback)(async (client, query, type) => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.globalSearch(query, type);
            setResults(response.data);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const getSuggestions = (0, react_1.useCallback)(async (client, query, type) => {
        try {
            const response = await client.getSearchSuggestions(query, type);
            setSuggestions(response.data);
            return response;
        }
        catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);
    return {
        results,
        loading,
        error,
        suggestions,
        search,
        getSuggestions,
        setResults,
    };
}
function usePagination(initialPage = 1, initialLimit = 10) {
    const [page, setPage] = (0, react_1.useState)(initialPage);
    const [limit, setLimit] = (0, react_1.useState)(initialLimit);
    const [total, setTotal] = (0, react_1.useState)(0);
    const [totalPages, setTotalPages] = (0, react_1.useState)(0);
    const updatePagination = (0, react_1.useCallback)((paginationData) => {
        setPage(paginationData.page);
        setLimit(paginationData.limit);
        setTotal(paginationData.total);
        setTotalPages(paginationData.totalPages);
    }, []);
    const goToPage = (0, react_1.useCallback)((newPage) => {
        setPage(Math.max(1, Math.min(newPage, totalPages)));
    }, [totalPages]);
    const nextPage = (0, react_1.useCallback)(() => {
        goToPage(page + 1);
    }, [page, goToPage]);
    const prevPage = (0, react_1.useCallback)(() => {
        goToPage(page - 1);
    }, [page, goToPage]);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        setPage,
        setLimit,
        updatePagination,
        goToPage,
        nextPage,
        prevPage,
    };
}
function useTokenStorage() {
    const [tokens, setTokens] = (0, react_1.useState)(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('restauranthub_tokens');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    });
    const saveTokens = (0, react_1.useCallback)((newTokens) => {
        setTokens(newTokens);
        if (typeof window !== 'undefined') {
            localStorage.setItem('restauranthub_tokens', JSON.stringify(newTokens));
        }
    }, []);
    const clearTokens = (0, react_1.useCallback)(() => {
        setTokens(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('restauranthub_tokens');
        }
    }, []);
    return {
        tokens,
        saveTokens,
        clearTokens,
    };
}
//# sourceMappingURL=react-hooks.js.map
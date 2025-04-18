import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from "@env";
import { AuthContext } from '../context/AuthContext';

const Bookmark = () => {
  const [selectedTab, setSelectedTab] = useState('requested');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchBookmarks();
  }, [selectedTab, token]);

  const fetchBookmarks = async () => {
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch incoming requests
      const incomingResponse = await axios.get(
        `${API_URL}/api/bookings/incomingrequests/`, 
        { headers }
      );
      
      // Log the first item's complete structure to see where the ID field is
      if (incomingResponse.data && incomingResponse.data.length > 0) {
        console.log("Sample incoming request structure:", JSON.stringify(incomingResponse.data[0]));
      }
      
      setIncomingRequests(incomingResponse.data);
      console.log("Fetched incoming requests:", incomingResponse.data);

      // Fetch my outgoing requests
      const myRequestsResponse = await axios.get(
        `${API_URL}/api/bookings/myrequests/`, 
        { headers }
      );
      
      setMyRequests(myRequestsResponse.data);
      console.log("Fetched my requests:", myRequestsResponse.data);
    } catch (error) {
      console.error("Error fetching bookmarks:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the updateBookingStatus function to handle the API URL correctly
  const updateBookingStatus = async (bookingId, status) => {
    if (!token) {
      console.error('No auth token found');
      return;
    }

    if (!bookingId) {
      console.error('No booking ID provided');
      return false;
    }

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Log the API URL and request data
      console.log(`Updating booking ${bookingId} to status: ${status}`);
      const apiUrl = `${API_URL}/api/bookings/update-status/${bookingId}/`;
      console.log(`API URL: ${apiUrl}`);
      console.log(`Request data:`, { status });
      console.log(`Request headers:`, headers);
      console.log(`Using PATCH request method instead of POST`);

      // Use PATCH request instead of POST
      const response = await axios.patch(
        apiUrl,
        { status },
        { headers }
      );
      
      console.log("Status update API response:", response.data);
      
      // Only update the local state if the API call was successful
      if (response.data && response.status === 200) {
        // Update the status in the local state for better UX
        setIncomingRequests(prevRequests => 
          prevRequests.map(request => {
            // Try all possible ID field names for comparison
            const requestId = request.id || request.booking_id || request._id || request.bookingId || request.booking;
            return requestId === bookingId ? { ...request, status } : request;
          })
        );
        
        // Fetch fresh data from the server to ensure data consistency
        await fetchBookmarks();
        return true;
      } else {
        console.error("API responded but status update may not have succeeded:", response);
        return false;
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error details:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Alternative updateBookingStatus function with different API format
  // Try this if the original function continues to fail
  const tryAlternativeUpdateFormat = async (bookingId, status) => {
    if (!token || !bookingId) return false;
    
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Try alternative API formats
      console.log("Trying alternative API format");
      
      // Option 1: Basic URL with PATCH request
      let apiUrl = `${API_URL}/api/bookings/${bookingId}/`;
      console.log(`Trying URL format 1 (PATCH direct to booking): ${apiUrl}`);
      
      try {
        const response = await axios.patch(
          apiUrl,
          { status },
          { headers }
        );
        
        if (response.status === 200) {
          console.log("Alternative format 1 succeeded");
          await fetchBookmarks();
          return true;
        }
      } catch (err) {
        console.log("Alternative format 1 failed:", err.message);
      }
      
      // Option 2: Different URL format - no trailing slash
      apiUrl = `${API_URL}/api/bookings/update-status/${bookingId}`;
      console.log(`Trying URL format 2 (PATCH): ${apiUrl}`);
      
      try {
        const response = await axios.patch(
          apiUrl,
          { status },
          { headers }
        );
        
        if (response.status === 200) {
          console.log("Alternative format 2 succeeded");
          await fetchBookmarks();
          return true;
        }
      } catch (err) {
        console.log("Alternative format 2 failed:", err.message);
      }
      
      // Option 3: Different endpoint structure
      apiUrl = `${API_URL}/api/bookings/${bookingId}/update-status/`;
      console.log(`Trying URL format 3 (PATCH): ${apiUrl}`);
      
      try {
        const response = await axios.patch(
          apiUrl,
          { status },
          { headers }
        );
        
        if (response.status === 200) {
          console.log("Alternative format 3 succeeded");
          await fetchBookmarks();
          return true;
        }
      } catch (err) {
        console.log("Alternative format 3 failed:", err.message);
      }
      
      // Option 4: Fallback to POST if PATCH didn't work
      apiUrl = `${API_URL}/api/bookings/update-status/${bookingId}/`;
      console.log(`Trying URL format 4 (POST): ${apiUrl}`);
      
      try {
        const response = await axios.post(
          apiUrl,
          { status },
          { headers }
        );
        
        if (response.status === 200) {
          console.log("Alternative format 4 succeeded");
          await fetchBookmarks();
          return true;
        }
      } catch (err) {
        console.log("Alternative format 4 failed:", err.message);
      }
      
      // Option 5: Using PUT instead of POST or PATCH
      apiUrl = `${API_URL}/api/bookings/update-status/${bookingId}/`;
      console.log(`Trying URL format 5 (PUT): ${apiUrl}`);
      
      try {
        const response = await axios.put(
          apiUrl,
          { status },
          { headers }
        );
        
        if (response.status === 200) {
          console.log("Alternative format 5 succeeded");
          await fetchBookmarks();
          return true;
        }
      } catch (err) {
        console.log("Alternative format 5 failed:", err.message);
      }
      
      return false;
    } catch (error) {
      console.error("All alternative formats failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    console.log("Handling approval for booking ID:", bookingId);
    let success = await updateBookingStatus(bookingId, 'approved');
    
    // If standard update fails, try alternative format
    if (!success) {
      console.log("Standard update failed, trying alternative...");
      success = await tryAlternativeUpdateFormat(bookingId, 'approved');
    }
    
    if (success) {
      console.log("Request approved successfully");
    } else {
      console.log("Failed to approve request after all attempts");
    }
  };

  const handleReject = async (bookingId) => {
    console.log("Handling rejection for booking ID:", bookingId);
    let success = await updateBookingStatus(bookingId, 'rejected');
    
    // If standard update fails, try alternative format
    if (!success) {
      console.log("Standard update failed, trying alternative...");
      success = await tryAlternativeUpdateFormat(bookingId, 'rejected');
    }
    
    if (success) {
      console.log("Request rejected successfully");
    } else {
      console.log("Failed to reject request after all attempts");
    }
  };

  const renderIncomingRequestCard = (item) => {
    console.log("Rendering incoming item:", item);
    
    const title = item.item_title || "Untitled Item";
    const renterName = item.renter_name || "Unknown User";
    const status = item.status || "pending";
    const imageUrl = item.image_url || 'https://via.placeholder.com/150';
    
    // Inspect the item structure completely
    console.log("Complete item object:", JSON.stringify(item));
    
    // Check for ID in multiple possible locations
    // The backend might be using one of these common naming conventions
    const bookingId = item.id || item.booking_id || item._id || item.bookingId || item.booking;
    
    console.log("Extracted booking ID:", bookingId);
    
    // Early return if bookingId is undefined
    if (!bookingId) {
      console.error("Missing booking ID for item:", item);
    }

    return (
      <View key={bookingId || `incoming-${Math.random()}`} style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardDetails}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.categoryText}>
              Requested by: {renterName}
            </Text>
            <View style={[styles.statusBadge, 
              status === 'approved' ? styles.statusApproved : 
              status === 'pending' ? styles.statusPending : 
              status === 'rejected' ? styles.statusRejected : 
              styles.statusDefault]}>
              <Text style={styles.statusText}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {status === 'pending' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.rejectButton} 
              onPress={() => {
                if (bookingId) {
                  handleReject(bookingId);
                } else {
                  console.error("Cannot reject: Missing booking ID");
                }
              }}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.approveButton} 
              onPress={() => {
                if (bookingId) {
                  handleApprove(bookingId);
                } else {
                  console.error("Cannot approve: Missing booking ID");
                }
              }}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'approved' && (
          <TouchableOpacity 
            style={styles.deliveryButton}
            onPress={() => router.push('Paymentgateway')}
          >
            <Text style={styles.buttonText}>Initiate Delivery</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMyRequestCard = (item) => {
    console.log("Rendering mine item:", item);
    
    const title = item.item_title || "Untitled Item";
    const renteeName = item.rentee_name || "Unknown Owner";
    const status = item.status || "pending";
    const imageUrl = item.image_url || 'https://via.placeholder.com/150';
    
    // Inspect the item structure completely
    console.log("Complete my request item object:", JSON.stringify(item));
    
    // Check for ID in multiple possible locations
    const bookingId = item.id || item.booking_id || item._id || item.bookingId || item.booking;
    
    console.log("Extracted my request booking ID:", bookingId);

    return (
      <View key={bookingId || `mine-${Math.random()}`} style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardDetails}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.categoryText}>
              Owner: {renteeName}
            </Text>
            <View style={[styles.statusBadge, 
              status === 'approved' ? styles.statusApproved : 
              status === 'pending' ? styles.statusPending : 
              status === 'rejected' ? styles.statusRejected : 
              styles.statusDefault]}>
              <Text style={styles.statusText}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => console.log('Cancel request', item.id)}
          >
            <Text style={styles.buttonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {status === 'approved' && (
          <TouchableOpacity 
            style={styles.deliveryButton}
            onPress={() => router.push('Paymentgateway')}
          >
            <Text style={styles.buttonText}>Initiate Delivery</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setSelectedTab('requested')}
            style={[
              styles.tabButton,
              selectedTab === 'requested' && styles.activeTab
            ]}
          >
            <Text style={styles.tabText}>Requested</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('approved')}
            style={[
              styles.tabButton,
              selectedTab === 'approved' && styles.activeTab
            ]}
          >
            <Text style={styles.tabText}>Approved</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : selectedTab === 'requested' ? (
            <>
              {/* Incoming Requests Section */}
              <Text style={styles.sectionTitle}>Incoming Requests</Text>
              {incomingRequests.length === 0 ? (
                <Text style={styles.emptyStateText}>No incoming requests</Text>
              ) : (
                incomingRequests.map(item => renderIncomingRequestCard(item))
              )}

              {/* My Requests Section */}
              <Text style={[styles.sectionTitle, styles.sectionSpacing]}>My Requests</Text>
              {myRequests.length === 0 ? (
                <Text style={styles.emptyStateText}>No outgoing requests</Text>
              ) : (
                myRequests.map(item => renderMyRequestCard(item))
              )}
            </>
          ) : (
            <>
              {/* Approved Items Section */}
              <Text style={styles.sectionTitle}>Approved Items</Text>
              {[...incomingRequests.filter(item => item.status === 'approved'),
                ...myRequests.filter(item => item.status === 'approved')].length === 0 ? (
                <Text style={styles.emptyStateText}>No approved items</Text>
              ) : (
                <>
                  {incomingRequests
                    .filter(item => item.status === 'approved')
                    .map(item => renderIncomingRequestCard(item))}
                  {myRequests
                    .filter(item => item.status === 'approved')
                    .map(item => renderMyRequestCard(item))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#161622',
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#161622',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabButton: {
    padding: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  scrollView: {
    marginTop: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  emptyStateText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#1E1E2D',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 15,
  },
  cardDetails: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusApproved: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  statusPending: {
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  statusRejected: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  statusDefault: {
    backgroundColor: 'rgba(189, 195, 199, 0.2)',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    padding: 8,
    borderRadius: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 14,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },
  deliveryButton: {
    marginTop: 14,
    backgroundColor: '#27ae60',
    padding: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  }
});

export default Bookmark;
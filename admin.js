// Admin Dashboard JavaScript
let allData = null;
let filteredInteractions = [];
let mentorsMap = {};
let menteesMap = {};

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeEventListeners();
});

// Load data from data.json
async function loadData() {
    try {
        const response = await fetch('data.json');
        allData = await response.json();
        
        // Create maps for quick lookup
        allData.mentors.forEach(mentor => {
            mentorsMap[mentor.mentor_id] = mentor;
        });
        
        allData.mentees.forEach(mentee => {
            menteesMap[mentee.mentee_id] = mentee;
        });
        
        // Update statistics
        updateStatistics();
        
        // Display all interactions initially
        displayInteractions(allData.interactions);
        
        // Display activity logs
        displayActivityLogs();
        
        // Hide loading spinner
        document.getElementById('loadingSpinner').style.display = 'none';
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loadingSpinner').innerHTML = 
            '<p style="color: #ef4444;">שגיאה בטעינת הנתונים</p>';
    }
}

// Update statistics cards
function updateStatistics() {
    if (!allData) return;
    
    document.getElementById('totalMentors').textContent = allData.statistics?.total_mentors || allData.mentors.length;
    document.getElementById('totalMentees').textContent = allData.statistics?.total_mentees || allData.mentees.length;
    document.getElementById('totalInteractions').textContent = allData.statistics?.total_interactions || allData.interactions.length;
    document.getElementById('activePairs').textContent = allData.statistics?.active_pairs || 0;
}

// Display interactions in table
function displayInteractions(interactions) {
    const tbody = document.getElementById('activityTableBody');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (!interactions || interactions.length === 0) {
        noResults.style.display = 'block';
        resultsCount.textContent = '0';
        return;
    }
    
    noResults.style.display = 'none';
    resultsCount.textContent = interactions.length;
    
    // Sort by timestamp (newest first)
    const sortedInteractions = [...interactions].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedInteractions.forEach(interaction => {
        const row = document.createElement('tr');
        
        // Format timestamp
        const timestamp = new Date(interaction.timestamp);
        const formattedDate = timestamp.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Get mentor and mentee names
        const mentorName = mentorsMap[interaction.mentor_id]?.name || interaction.mentor_id;
        const menteeName = menteesMap[interaction.mentee_id]?.name || interaction.mentee_id;
        
        // Create activity type badge
        const activityType = interaction.type || 'message';
        const activityBadge = `<span class="activity-type ${activityType}">${getActivityTypeLabel(activityType)}</span>`;
        
        // Create tags
        const tagsHtml = interaction.tags ? 
            `<div class="tags">${interaction.tags.map(tag => 
                `<span class="tag">${getTagLabel(tag)}</span>`
            ).join('')}</div>` : '';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${activityBadge}</td>
            <td>${mentorName}</td>
            <td>${menteeName}</td>
            <td>${interaction.content || '-'}</td>
            <td>${tagsHtml}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Get activity type label in Hebrew
function getActivityTypeLabel(type) {
    const labels = {
        'message': 'הודעה',
        'meeting': 'פגישה',
        'feedback': 'משוב',
        'login': 'התחברות',
        'registration': 'הרשמה',
        'profile_update': 'עדכון פרופיל'
    };
    return labels[type] || type;
}

// Get tag label in Hebrew
function getTagLabel(tag) {
    if (!allData?.tags_reference) return tag;
    return allData.tags_reference[tag] || tag;
}

// Display activity logs
function displayActivityLogs() {
    if (!allData) return;
    
    // Display mentors activity
    const mentorsLogsContainer = document.getElementById('mentorsLogs');
    if (allData.activity_logs?.mentors_activity) {
        mentorsLogsContainer.innerHTML = allData.activity_logs.mentors_activity
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(log => {
                const mentorName = mentorsMap[log.mentor_id]?.name || log.mentor_id;
                const timestamp = new Date(log.timestamp).toLocaleString('he-IL');
                const tagsHtml = log.tags ? 
                    `<div class="log-tags">${log.tags.map(tag => 
                        `<span class="tag">${getTagLabel(tag)}</span>`
                    ).join('')}</div>` : '';
                
                return `
                    <div class="log-item">
                        <div class="log-info">
                            <div class="log-activity">${mentorName} - ${log.activity}</div>
                            <div class="log-timestamp">${timestamp}</div>
                        </div>
                        ${tagsHtml}
                    </div>
                `;
            }).join('');
    }
    
    // Display mentees activity
    const menteesLogsContainer = document.getElementById('menteesLogs');
    if (allData.activity_logs?.mentees_activity) {
        menteesLogsContainer.innerHTML = allData.activity_logs.mentees_activity
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(log => {
                const menteeName = menteesMap[log.mentee_id]?.name || log.mentee_id;
                const timestamp = new Date(log.timestamp).toLocaleString('he-IL');
                const tagsHtml = log.tags ? 
                    `<div class="log-tags">${log.tags.map(tag => 
                        `<span class="tag">${getTagLabel(tag)}</span>`
                    ).join('')}</div>` : '';
                
                return `
                    <div class="log-item">
                        <div class="log-info">
                            <div class="log-activity">${menteeName} - ${log.activity}</div>
                            <div class="log-timestamp">${timestamp}</div>
                        </div>
                        ${tagsHtml}
                    </div>
                `;
            }).join('');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Apply filters button
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    
    // Reset filters button
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
    
    // Search input - apply on Enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Tab switching for activity logs
    const logTabs = document.querySelectorAll('.log-tab');
    logTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            logTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.logs-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}Logs`).classList.add('active');
        });
    });
}

// Apply filters
function applyFilters() {
    if (!allData) return;
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const activityType = document.getElementById('activityTypeFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    
    let filtered = [...allData.interactions];
    
    // Filter by search term (mentor or mentee name)
    if (searchTerm) {
        filtered = filtered.filter(interaction => {
            const mentorName = (mentorsMap[interaction.mentor_id]?.name || '').toLowerCase();
            const menteeName = (menteesMap[interaction.mentee_id]?.name || '').toLowerCase();
            return mentorName.includes(searchTerm) || menteeName.includes(searchTerm);
        });
    }
    
    // Filter by activity type
    if (activityType !== 'all') {
        filtered = filtered.filter(interaction => 
            interaction.type === activityType
        );
    }
    
    // Filter by date range
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(interaction => 
            new Date(interaction.timestamp) >= fromDate
        );
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(interaction => 
            new Date(interaction.timestamp) <= toDate
        );
    }
    
    filteredInteractions = filtered;
    displayInteractions(filtered);
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('activityTypeFilter').value = 'all';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    
    if (allData) {
        displayInteractions(allData.interactions);
    }
}

import React, { useState } from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import { useBehavior } from '../../contexts/BehaviorContext';
import { ZONE_STYLES } from '../../utils/constants';
import ZoneStudentsModal from '../modals/ZoneStudentsModal';

const DashboardView = () => {
  const {
    students,
    staff,
    incidents,
    calculateStudentZone
  } = useBehavior();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [selectedZone, setSelectedZone] = useState(null);

  const getZoneDistribution = () => {
    const distribution = { Green: 0, Yellow: 0, Orange: 0, Red: 0 };
    
    students.forEach(student => {
      const zone = calculateStudentZone(student.name).zone;
      distribution[zone]++;
    });
    return distribution;
  };

  const getStaffReportCounts = () => {
    return staff.map(member => ({
      name: member.name,
      reports: incidents.filter(incident => incident.staffMember === member.name).length
    })).sort((a, b) => b.reports - a.reports);
  };

  const getIncidentTypeDistribution = () => {
    return incidents.reduce((acc, incident) => {
      acc[incident.incident] = (acc[incident.incident] || 0) + 1;
      return acc;
    }, {});
  };

  const getLocationDistribution = () => {
    return incidents.reduce((acc, incident) => {
      acc[incident.location] = (acc[incident.location] || 0) + 1;
      return acc;
    }, {});
  };

  const zoneDistribution = getZoneDistribution();
  const staffReports = getStaffReportCounts();
  const incidentTypes = getIncidentTypeDistribution();
  const locations = getLocationDistribution();

  const filteredIncidents = incidents
    .filter(incident => {
      const matchesSearch = searchTerm === '' ||
        incident.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (incident.description && incident.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        incident.incident.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = filterSeverity === 'All' || incident.severity === filterSeverity;

      return matchesSearch && matchesSeverity;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      {selectedZone && (
        <ZoneStudentsModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Zone Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Zone Distribution</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(zoneDistribution).map(([zone, count]) => {
              const zoneStyle = ZONE_STYLES[zone];
              const percentage = (count / students.length * 100).toFixed(1);

              return (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 rounded-lg ${zoneStyle.light} hover:opacity-90 transition-opacity cursor-pointer`}
                >
                  <div className={`text-2xl font-bold ${zoneStyle.text} mb-1`}>
                    {count}
                    <span className="text-sm font-normal ml-2">({percentage}%)</span>
                  </div>
                  <div className={`text-sm font-medium ${zoneStyle.text}`}>{zone} Zone</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Staff Report Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Report Distribution</h2>
          <div className="space-y-3">
            {staffReports.slice(0, 5).map((staffMember, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{staffMember.name}</span>
                    <span className="text-sm text-gray-600">{staffMember.reports} reports</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(staffMember.reports / Math.max(...staffReports.map(s => s.reports))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Incident Types</h2>
          <div className="space-y-3">
            {Object.entries(incidentTypes)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([type, count], index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{type}</span>
                      <span className="text-sm text-gray-600">{count} incidents</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(incidentTypes))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Locations</h2>
          <div className="space-y-3">
            {Object.entries(locations)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([location, count], index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{location}</span>
                      <span className="text-sm text-gray-600">{count} incidents</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(locations))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-0">Recent Incidents</h2>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search incidents..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none w-full md:w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Severities</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Incidents Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterSeverity !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'No incidents have been recorded yet'}
              </p>
            </div>
          ) : (
            filteredIncidents.map((incident, index) => {
              const studentZone = calculateStudentZone(incident.studentName);
              const zoneStyle = ZONE_STYLES[studentZone.zone];

              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{incident.studentName}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${zoneStyle.light} ${zoneStyle.text}`}>
                          {studentZone.zone}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          incident.severity === 'Minor' ? 'bg-gray-100 text-gray-600' :
                          incident.severity === 'Major' ? 'bg-orange-100 text-orange-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{incident.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{incident.incident}</span>
                        <span>•</span>
                        <span>{incident.location}</span>
                        <span>•</span>
                        <span>Reported by {incident.staffMember}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(incident.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{incident.time}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardView; 
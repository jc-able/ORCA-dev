import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Card, 
  CardContent, 
  Divider, 
  Tooltip, 
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { 
  ZoomIn, 
  ZoomOut, 
  CenterFocusStrong, 
  People as PeopleIcon, 
  PersonAdd, 
  Group, 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  HowToReg as ConvertIcon
} from '@mui/icons-material';
import * as d3 from 'd3';

/**
 * ReferralNetwork component
 * Uses D3.js to visualize referral relationships
 * Shows connections between members and their referrals
 */
const ReferralNetwork = ({ data = [], loading = false, onSelectPerson, onCreateLead, onConvertToMember }) => {
  const d3Container = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [filteredData, setFilteredData] = useState(data);
  
  // Apply filters and search to the data
  useEffect(() => {
    if (!data || !data.nodes || !data.links) {
      setFilteredData({ nodes: [], links: [] });
      return;
    }
    
    let filteredNodes = [...data.nodes];
    
    // Apply type filter
    if (filter !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.type === filter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.first_name.toLowerCase().includes(lowercaseSearch) ||
        node.last_name.toLowerCase().includes(lowercaseSearch) ||
        (node.email && node.email.toLowerCase().includes(lowercaseSearch)) ||
        (node.phone && node.phone.includes(searchTerm))
      );
    }
    
    // Get IDs of filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links to only include connections between filtered nodes
    const filteredLinks = data.links.filter(link => 
      filteredNodeIds.has(link.source.id || link.source) && 
      filteredNodeIds.has(link.target.id || link.target)
    );
    
    setFilteredData({ 
      nodes: filteredNodes, 
      links: filteredLinks 
    });
    
  }, [data, filter, searchTerm]);
  
  // D3 visualization setup
  useEffect(() => {
    if (loading || !filteredData.nodes || !filteredData.nodes.length || !d3Container.current) {
      return;
    }
    
    // Clear previous visualization
    d3.select(d3Container.current).selectAll('*').remove();
    
    // Set up dimensions
    const width = d3Container.current.clientWidth;
    const height = 500;
    
    // Create SVG element
    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Define arrow markers for directed links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20) // Position the arrow away from the target node
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#00BFFF')
      .style('stroke', 'none');
    
    // Define marker for multiple referrers links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead-multiple')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#808080')
      .style('stroke', 'none');
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    
    svg.call(zoom);
    
    // Create a group for all elements to enable zooming
    const g = svg.append('g');
    
    // Separate members and referrals
    const memberNodes = filteredData.nodes.filter(node => node.type === 'member');
    const referralNodes = filteredData.nodes.filter(node => node.type === 'referral');
    
    // Calculate positions for members (across the top)
    const memberSpacing = width / (memberNodes.length + 1);
    memberNodes.forEach((node, index) => {
      node.x = memberSpacing * (index + 1);
      node.y = 60; // Fixed Y position at the top
      node.fx = node.x; // Fix X position
      node.fy = node.y; // Fix Y position
    });
    
    // Create a map of referrals by their referrer
    const referralsByReferrer = {};
    
    // Process links to group referrals by their referrer
    filteredData.links.forEach(link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      
      // Skip member-to-member links for this grouping
      const sourceNode = filteredData.nodes.find(n => n.id === sourceId);
      const targetNode = filteredData.nodes.find(n => n.id === targetId);
      
      if (sourceNode && sourceNode.type === 'member' && targetNode && targetNode.type === 'referral') {
        if (!referralsByReferrer[sourceId]) {
          referralsByReferrer[sourceId] = [];
        }
        referralsByReferrer[sourceId].push(targetId);
      }
    });
    
    // Position referrals below their referrers
    Object.keys(referralsByReferrer).forEach(referrerId => {
      const referrer = filteredData.nodes.find(n => n.id === referrerId);
      const referrals = referralsByReferrer[referrerId];
      
      if (referrer && referrals.length) {
        const referralSpacing = memberSpacing / (referrals.length + 1);
        const startX = referrer.x - (memberSpacing / 2) + referralSpacing;
        
        referrals.forEach((referralId, index) => {
          const referral = filteredData.nodes.find(n => n.id === referralId);
          if (referral) {
            referral.x = startX + (referralSpacing * index);
            referral.y = 150; // Position below members
            
            // For referrals with multiple referrers, don't fix position
            const hasMultipleReferrers = filteredData.links.filter(
              l => (l.target.id === referralId || l.target === referralId) && l.multipleReferrers
            ).length > 0;
            
            if (!hasMultipleReferrers) {
              referral.fx = referral.x;
              referral.fy = referral.y;
            }
          }
        });
      }
    });
    
    // Handle referrals with multiple referrers - position them between their referrers
    filteredData.links.forEach(link => {
      if (link.multipleReferrers) {
        const targetId = link.target.id || link.target;
        const sourceId = link.source.id || link.source;
        
        const targetNode = filteredData.nodes.find(n => n.id === targetId);
        const sourceNode = filteredData.nodes.find(n => n.id === sourceId);
        
        if (targetNode && sourceNode) {
          // Check if this is a member to referral connection with multiple referrers
          if (sourceNode.type === 'member' && targetNode.type === 'referral') {
            // Determine all referrers for this referral
            const referrers = filteredData.links
              .filter(l => (l.target.id === targetId || l.target === targetId))
              .map(l => l.source.id || l.source);
              
            // Get unique referrers
            const uniqueReferrers = [...new Set(referrers)];
            
            if (uniqueReferrers.length > 1) {
              // Get all referrer nodes
              const referrerNodes = uniqueReferrers
                .map(id => filteredData.nodes.find(n => n.id === id))
                .filter(Boolean);
                
              // Calculate average X position of referrers
              const avgX = referrerNodes.reduce((sum, node) => sum + node.x, 0) / referrerNodes.length;
              
              // Position this referral in the middle of its referrers, but in row 2
              targetNode.x = avgX;
              targetNode.y = 220; // Position below the typical referral row
            }
          }
        }
      }
    });
    
    // Create force simulation with modified settings for hierarchical layout
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force('link', d3.forceLink(filteredData.links)
        .id(d => d.id)
        .distance(80)) // Shorter distance for more compact layout
      .force('charge', d3.forceManyBody()
        .strength(-200)) // Reduced strength to prevent too much repulsion
      .force('x', d3.forceX().strength(0.1)) // Light force toward initial X positions
      .force('y', d3.forceY().strength(0.2)) // Stronger Y force to maintain hierarchy
      .force('collide', d3.forceCollide().radius(40)); // Prevent node overlap
    
    // Add links with improved styling and arrows
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredData.links)
      .enter()
      .append('line')
      .attr('stroke', d => d.multipleReferrers ? '#808080' : '#00BFFF')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.multipleReferrers ? 2 : 1)
      .attr('stroke-dasharray', d => d.multipleReferrers ? '5,5' : null)
      .attr('marker-end', d => d.multipleReferrers ? 'url(#arrowhead-multiple)' : 'url(#arrowhead)');
    
    // Create a group for each node with improved styling
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(filteredData.nodes)
      .enter()
      .append('g')
      .attr('class', d => `node ${d.type}`)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        // Select node and trigger callback
        setSelectedNode(d);
        if (onSelectPerson) {
          onSelectPerson(d);
        }
        
        // Update styling for selected node
        d3.selectAll('.node').classed('selected', false);
        d3.select(event.currentTarget).classed('selected', true);
      });
    
    // Add circle backgrounds for nodes for better visibility
    node.append('circle')
      .attr('r', d => d.type === 'member' ? 16 : 14) // Larger nodes
      .attr('fill', '#121212')
      .attr('stroke', 'none')
      .attr('opacity', 0.6);
      
    // Add circles for nodes with improved styling
    node.append('circle')
      .attr('r', d => d.type === 'member' ? 14 : 12) // Larger nodes
      .attr('fill', d => d.type === 'member' ? '#00BFFF' : '#4CAF50') // Blue for members, green for referrals
      .attr('stroke', '#121212')
      .attr('stroke-width', 1.5);
    
    // Add icons with improved styling
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#FFFFFF') // White icon for better contrast
      .attr('font-family', 'Material Icons')
      .attr('font-size', '0.9rem') // Slightly larger
      .text(d => d.type === 'member' ? '\ue7fb' : '\ue7fd'); // Person vs. PersonAdd icon codes
    
    // Add labels with improved styling and positioning
    node.append('text')
      .attr('dx', 0)
      .attr('dy', d => d.type === 'member' ? -20 : 22) // Position labels above members, below referrals
      .attr('text-anchor', 'middle')
      .attr('fill', '#E0E0E0')
      .text(d => `${d.first_name} ${d.last_name}`)
      .attr('font-size', '0.75rem')
      .attr('font-weight', '500') // Medium weight for better readability
      .attr('background', '#121212');
    
    // Add a shadow/highlight effect for better visibility
    node.insert('circle', 'circle')
      .attr('r', d => d.type === 'member' ? 18 : 16)
      .attr('fill', 'none')
      .attr('stroke', d => d.type === 'member' ? 'rgba(0, 191, 255, 0.3)' : 'rgba(76, 175, 80, 0.3)')
      .attr('stroke-width', 4)
      .style('pointer-events', 'none'); // Don't interfere with mouse events
    
    // Update positions on tick with collision detection
    simulation.on('tick', () => {
      // Keep nodes within bounds
      filteredData.nodes.forEach(d => {
        if (!d.fx) d.x = Math.max(20, Math.min(width - 20, d.x));
        if (!d.fy) d.y = Math.max(20, Math.min(height - 20, d.y));
      });
      
      // Update link positions
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => {
          // Offset the end point to make room for the arrow
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          const offsetX = dx * 15 / dr; // Scale by node radius
          return d.target.x - offsetX;
        })
        .attr('y2', d => {
          // Offset the end point to make room for the arrow
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          const offsetY = dy * 15 / dr; // Scale by node radius
          return d.target.y - offsetY;
        });
      
      // Update node positions
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Run simulation for a few ticks to get the layout started, then stop
    simulation.alpha(1).restart();
    
    // After some time, stop the simulation to keep the hierarchical layout stable
    setTimeout(() => {
      simulation.stop();
      // Fix all node positions after initial layout
      filteredData.nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });
    }, 2000);
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep nodes fixed after dragging for a better user experience
      d.fx = event.x;
      d.fy = event.y;
    }
    
    // Add CSS for selected nodes
    svg.append('style').text(`
      .node.selected circle {
        stroke: #FFFFFF;
        stroke-width: 2px;
      }
      .node.selected text {
        fill: #FFFFFF;
        font-weight: bold;
      }
      .node.member circle {
        fill: #00BFFF;
      }
      .node.referral circle {
        fill: #4CAF50;
      }
    `);
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [filteredData, loading, onSelectPerson]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    d3.select(d3Container.current)
      .select('svg')
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, 1.3);
  };
  
  const handleZoomOut = () => {
    d3.select(d3Container.current)
      .select('svg')
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, 0.7);
  };
  
  const handleResetZoom = () => {
    d3.select(d3Container.current)
      .select('svg')
      .transition()
      .duration(300)
      .call(d3.zoom().transform, d3.zoomIdentity);
  };
  
  // Handle search input
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };
  
  // Display loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Empty state
  if (!data.nodes || data.nodes.length === 0) {
    return (
      <Box 
        sx={{ 
          height: '300px', 
          backgroundColor: 'rgba(0,191,255,0.1)', 
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px dashed',
          borderColor: 'primary.main'
        }}
      >
        <Typography variant="subtitle1" color="primary.main">
          No referral data available. Create your first referral to start building your network.
        </Typography>
      </Box>
    );
  }
  
  // Filter and create nodes count
  const membersCount = data.nodes.filter(node => node.type === 'member').length;
  const referralsCount = data.nodes.filter(node => node.type === 'referral').length;
  
  return (
    <Box>
      {/* Search and filter controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <TextField
          placeholder="Search network"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="filter-select-label">Filter By</InputLabel>
          <Select
            labelId="filter-select-label"
            value={filter}
            label="Filter By"
            onChange={handleFilterChange}
            startAdornment={
              <InputAdornment position="start">
                <FilterIcon fontSize="small" />
              </InputAdornment>
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="member">Members</MenuItem>
            <MenuItem value="referral">Referrals</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Stats and visualization controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            icon={<PeopleIcon fontSize="small" />} 
            label={`${membersCount} Members`} 
            variant="outlined" 
            color="primary" 
          />
          <Chip 
            icon={<PersonAdd fontSize="small" />} 
            label={`${referralsCount} Referrals`} 
            variant="outlined" 
            color="success" 
          />
        </Box>
        
        <Box>
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={handleZoomIn} sx={{ mr: 1 }}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={handleZoomOut} sx={{ mr: 1 }}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Reset view">
            <IconButton size="small" onClick={handleResetZoom}>
              <CenterFocusStrong />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Legend */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Box sx={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            backgroundColor: '#00BFFF', 
            mr: 1 
          }} />
          <Typography variant="caption">Member</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Box sx={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            backgroundColor: '#4CAF50', 
            mr: 1 
          }} />
          <Typography variant="caption">Referral</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 15, 
            height: 2, 
            backgroundColor: '#808080', 
            mr: 1,
            backgroundImage: 'linear-gradient(to right, #808080 50%, transparent 50%)',
            backgroundSize: '10px 100%',
            backgroundRepeat: 'repeat-x'
          }} />
          <Typography variant="caption">Multiple Referrers</Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Network visualization */}
        <Box 
          ref={d3Container} 
          sx={{ 
            height: '500px',
            flexGrow: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper'
          }}
        />
        
        {/* Selected node details */}
        <Card sx={{ width: '280px', height: 'fit-content' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {selectedNode ? 'Selected Person' : 'Person Details'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {selectedNode ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: selectedNode.type === 'member' ? '#00BFFF' : '#4CAF50',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mr: 1
                  }}>
                    {selectedNode.type === 'member' ? <PeopleIcon /> : <PersonAdd />}
                  </Box>
                  <Typography fontWeight="medium">
                    {selectedNode.first_name} {selectedNode.last_name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Type:</strong> {selectedNode.type === 'member' ? 'Member' : 'Referral'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Email:</strong> {selectedNode.email || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Phone:</strong> {selectedNode.phone || 'N/A'}
                </Typography>
                
                {selectedNode.referrals_count > 0 && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Referrals:</strong> {selectedNode.referrals_count}
                  </Typography>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={selectedNode.type === 'member' ? <Group /> : <PersonAdd />}
                    onClick={() => onSelectPerson(selectedNode)}
                  >
                    {selectedNode.type === 'member' ? 'View Member' : 'View Referral'}
                  </Button>
                  
                  {/* Action buttons based on node type */}
                  {selectedNode.type === 'referral' && (
                    <>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={() => onCreateLead && onCreateLead(selectedNode)}
                      >
                        Create Lead
                      </Button>
                      
                      <Button 
                        variant="outlined" 
                        size="small" 
                        color="info"
                        startIcon={<ConvertIcon />}
                        onClick={() => onConvertToMember && onConvertToMember(selectedNode)}
                      >
                        Convert to Member
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Click on a person in the network to see their details and available actions.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ReferralNetwork; 
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, Select, MenuItem, Grid, Card, CardContent, Divider, Table, TableBody, TableRow, TableCell } from '@mui/material';
import axios from 'axios';
// Add these imports for Excel
import * as XLSX from 'xlsx';

const FILE_TYPES = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'xlsx' },
  { label: 'Text', value: 'txt' }
  // For PDF/Word, see note below
];

const SearchNames = () => {
  const [search, setSearch] = useState('');
  const [serviceLine, setServiceLine] = useState('');
  const [ipr, setIpr] = useState('');
  const [category, setCategory] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadType, setDownloadType] = useState('csv');

  const [serviceLineOptions, setServiceLineOptions] = useState([]);
  const [iprOptions, setIprOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);

  useEffect(() => {
    axios.get('/api/v1/approved-names/options/service-lines').then(res => setServiceLineOptions(res.data));
    axios.get('/api/v1/approved-names/options/ipr').then(res => setIprOptions(res.data));
    axios.get('/api/v1/approved-names/options/categories').then(res => setCategoryOptions(res.data));
    axios.get('/api/v1/approved-names/options/classes').then(res => setClassOptions(res.data));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (serviceLine) params.serviceLine = serviceLine;
    if (ipr) params.ipr = ipr;
    if (category) params.category = category;
    if (classFilter) params.class = classFilter;
    const res = await axios.get('/api/v1/approved-names', { params });
    setResults(res.data);
    setLoading(false);
  };

  // Download results in selected format
  const handleDownload = () => {
    if (!results.length) return;
    const headers = [
      'Approved Name', 'Description', 'Service Line', 'IPR', 'Category', 'Class', 'Contact Person'
    ];
    const rows = results.map(r =>
      [
        r.approvedName,
        r.description,
        r.serviceLine,
        r.ipr,
        r.category,
        r.class,
        r.contactPerson
      ]
    );

    if (downloadType === 'csv') {
      const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val || ''}"`).join(','))
      ];
      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csvContent);
      link.download = 'approved_names.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (downloadType === 'txt') {
      const txtRows = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ];
      const txtContent = "data:text/plain;charset=utf-8," + txtRows.join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(txtContent);
      link.download = 'approved_names.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (downloadType === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'ApprovedNames');
      XLSX.writeFile(wb, 'approved_names.xlsx');
    }
    // For PDF/Word, see note below
  };

  // Reset all filters and search
  const handleReset = () => {
    setSearch('');
    setServiceLine('');
    setIpr('');
    setCategory('');
    setClassFilter('');
    setResults([]);
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mt: 5, mb: 5 }}>Search Approved Names</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            label="Search by keyword"
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Select
            value={serviceLine}
            onChange={e => setServiceLine(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">Service Line</MenuItem>
            {serviceLineOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Select
            value={ipr}
            onChange={e => setIpr(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">IPR</MenuItem>
            {iprOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Select
            value={category}
            onChange={e => setCategory(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">Category</MenuItem>
            {categoryOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">Class</MenuItem>
            {classOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={12} md={2}>
          <Button variant="contained" onClick={handleSearch} disabled={loading} fullWidth>
            Search
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Select
            value={downloadType}
            onChange={e => setDownloadType(e.target.value)}
            fullWidth
          >
            {FILE_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Button variant="outlined" onClick={handleDownload} disabled={!results.length} fullWidth>
            Download
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Button variant="text" onClick={handleReset} fullWidth>
            Reset
          </Button>
        </Grid>
      </Grid>
      <Box mt={3}>
        {loading && <Typography>Loading...</Typography>}
        {!loading && results.length === 0 && (
          <Typography>No results found.</Typography>
        )}
        <Grid container spacing={4} sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
          {results.map((name, idx) => (
            <Grid item xs={12} sm={6} md={6} key={idx}>
              <Card
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                variant="outlined"
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    pb: 3,
                    pt: 3,
                    px: 3,
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {name.approvedName || '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {name.contactPerson || '—'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {name.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 1,
                        fontWeight: 'bold',
                        alignSelf: 'flex-start',
                        textAlign: 'left',
                        pt: 0.5
                      }}
                    >
                      Details
                    </Typography>
                    <Table size="small" sx={{ mb: 2, background: 'transparent' }}>
                      <TableBody>
                        {Object.entries(name).map(([key, value]) =>
                          value &&
                          !['approvedName', 'description', 'contactPerson', '_id'].includes(key) ? (
                            <TableRow key={key}>
                              <TableCell sx={{ border: 0, pl: 0, pr: 2, width: 140, color: 'text.secondary', fontWeight: 500, verticalAlign: 'top', py: 1.2 }}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </TableCell>
                              <TableCell sx={{ border: 0, py: 1.2, verticalAlign: 'top' }}>
                                {value}
                              </TableCell>
                            </TableRow>
                          ) : null
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default SearchNames;
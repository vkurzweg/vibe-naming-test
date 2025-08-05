// import React, { useState } from 'react';
// import {
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
//   Typography,
//   Container,
//   Paper,
//   Box,
//   Grid,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   createTheme,
//   ThemeProvider,
//   CssBaseline,
//   Card,
//   CardContent,
//   TextField,
//   Button,
//   CircularProgress,
// } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
// import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
// import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
// import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
// import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
// import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// // Custom Material-UI theme for a clean, professional look
// const theme = createTheme({
//   palette: {
//     primary: {
//       main: '#0033A0', // A Cognizant-like blue
//     },
//     secondary: {
//       main: '#00A3E0', // A lighter blue for accents
//     },
//     background: {
//       default: '#F5F5F5',
//       paper: '#FFFFFF',
//     },
//     success: {
//       main: '#388E3C',
//       light: '#E8F5E9',
//     },
//     error: {
//       main: '#D32F2F',
//       light: '#FFEBEE',
//     },
//   },
//   typography: {
//     fontFamily: 'Inter, Arial, sans-serif',
//     h4: {
//       fontWeight: 700,
//       color: '#fff',
//     },
//     h5: {
//       fontWeight: 600,
//       marginBottom: '1rem',
//       marginTop: '1.5rem',
//     },
//     h6: {
//       fontWeight: 600,
//     },
//     subtitle1: {
//       fontWeight: 500,
//     },
//   },
//   components: {
//     MuiAccordionSummary: {
//       styleOverrides: {
//         root: {
//           backgroundColor: '#E8EAF6',
//           borderRadius: '8px',
//           margin: '8px 0',
//           '&:hover': {
//             backgroundColor: '#C5CAE9',
//           },
//         },
//       },
//     },
//     MuiPaper: {
//       styleOverrides: {
//         root: {
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       },
//     },
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           transition: 'transform 0.2s ease-in-out',
//           '&:hover': {
//             transform: 'translateY(-5px)',
//             boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
//           },
//         },
//       },
//     },
//   },
// });

// const namingPrinciples = [
//   { title: 'Put the client first', description: 'Create names with the client\'s needs and clarity in mind. This is our primary objective.' },
//   { title: 'Use descriptive names', description: 'Use commonly-used terminology that makes it obvious what the offering is or does. E.g., "Pizza Place" vs. "Gusto".' },
//   { title: 'Be specific', description: 'Names should be specific enough that they wouldn\'t apply to many other offerings. E.g., "Pizza Place" is better than "Food".' },
//   { title: 'Simplify', description: 'Use as few words as possible to achieve specific, descriptive names. Generally 1-3 words.' },
// ];

// const namingDos = [
//   'Use real words found in a dictionary.',
//   'Keep names short (1-3 words) and easy to read, write, spell, and pronounce.',
//   'Ensure names are linguistically viable across cultures and languages.',
//   'Use descriptive names that clearly and obviously state what the offering does.',
// ];

// const namingDonts = [
//   'Composite words (e.g., "WordPress")',
//   'Coined (made up) names (e.g., "Pixar")',
//   'Creative spelling (e.g., "Krispy Kreme")',
//   'Acronyms or abbreviations (e.g., "CLAS")',
//   'Allusions to mythology or suggestive concepts (e.g., "Zeus")',
//   'Words with negative or culturally insensitive connotations in other languages (e.g., "gift" in German means "poison")',
//   'Symbols (&, +, *)',
// ];

// const namingProcess = [
//   { title: '1. Generate Names', description: 'Brainstorm a list of descriptive, real-word names.', icon: <LightbulbOutlinedIcon fontSize="large" /> },
//   { title: '2. Check Availability', description: 'Check with search engines and the USPTO website to ensure no one else is using it.', icon: <SearchOutlinedIcon fontSize="large" /> },
//   { title: '3. Submit for Approval', description: 'Fill out and submit the Naming Request form for brand and legal approval.', icon: <CheckCircleOutline fontSize="large" /> },
// ];

// const thirdPartyGuidelines = [
//   'Generally, prefer to exclude third-party names (e.g., Azure, Oracle).',
//   'If the offering is specific to a third party, use "for [third party]". Example: Cognizant® Restart Automation Service for Oracle.',
//   'If the offering uses a specific product/platform, append "using" or "with" the applicable asset name. Example: Cognizant® Connectivity Framework for Kafka using webMethods.',
// ];

// // Function to handle the exponential backoff for API calls
// const withExponentialBackoff = async (func, maxRetries = 5, delay = 1000) => {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await func();
//     } catch (error) {
//       if (i === maxRetries - 1) throw error;
//       await new Promise(resolve => setTimeout(resolve, delay * (2 ** i)));
//     }
//   }
// };

// const NamingGuidelines = () => {
//   const [expanded, setExpanded] = useState(false);
//   const [namePrompt, setNamePrompt] = useState('');
//   const [generatedNames, setGeneratedNames] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleChange = (panel) => (event, isExpanded) => {
//     setExpanded(isExpanded ? panel : false);
//   };

//   const generateNames = async () => {
//     setIsLoading(true);
//     setGeneratedNames([]);
//     setError(null);

//     const prompt = `
//       You are a naming expert for the brand 'Cognizant'. Your task is to generate a list of 5-7 name ideas for a new offering. The names must adhere to the following principles:
//       - Be descriptive of what the offering is or does.
//       - Use real words found in a dictionary.
//       - Be short, generally 1-3 words.
//       - Be easy to read, write, spell, and pronounce.
//       - Do not use acronyms, abbreviations, composite words (e.g., 'WordPress'), coined/made-up words, or creative spelling.
//       - Do not use symbols or allusions to mythology.
      
//       The offering is described as: "${namePrompt}".
      
//       Provide the names as a simple, numbered list.
//     `;

//     try {
//       const payload = { contents: [{ parts: [{ text: prompt }] }] };
//       const apiKey = "";
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       const response = await withExponentialBackoff(() => fetch(apiUrl, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//       }));

//       if (!response.ok) {
//         throw new Error(`API call failed with status: ${response.status}`);
//       }

//       const result = await response.json();
//       if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
//         const text = result.candidates[0].content.parts[0].text;
//         // Simple parsing of the numbered list from the text response
//         const names = text.split('\n').filter(line => line.match(/^\d+\./)).map(line => line.replace(/^\d+\.\s*/, '').trim());
//         setGeneratedNames(names);
//       } else {
//         throw new Error("Invalid response from API");
//       }
//     } catch (err) {
//       console.error("Error generating names:", err);
//       setError("Failed to generate names. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <Container maxWidth="md">
//         {/* Main Banner */}
//         <Box
//           sx={{
//             my: 4,
//             p: 4,
//             borderRadius: '12px',
//             background: 'linear-gradient(45deg, #0033A0 30%, #00A3E0 90%)',
//             boxShadow: '0 3px 5px 2px rgba(0, 51, 160, .3)',
//             color: 'white',
//           }}
//         >
//           <Typography variant="h4" component="h1" align="center" gutterBottom>
//             Cognizant Naming Guidelines
//           </Typography>
//           <Typography variant="body1" align="center" sx={{ opacity: 0.9 }}>
//             This interactive guide summarizes the key principles for creating names at Cognizant. The goal is to
//             create clear, descriptive names that help our audiences understand our offerings and reinforce the
//             Cognizant masterbrand.
//           </Typography>
//         </Box>

//         {/* New Gemini API Integration Section (Moved to top) */}
//         <Box sx={{ my: 4 }}>
//           <Paper elevation={3} sx={{ p: 3 }}>
//             <Typography variant="h6" align="center" gutterBottom>
//               ✨ Generate Name Ideas ✨
//             </Typography>
//             <Typography variant="body2" align="center" gutterBottom>
//               Describe your offering and get a list of name suggestions that align with the brand guidelines.
//             </Typography>
//             <TextField
//               fullWidth
//               multiline
//               rows={4}
//               label="Describe the offering (e.g., 'An AI-powered tool for cloud migration and cost optimization')"
//               variant="outlined"
//               value={namePrompt}
//               onChange={(e) => setNamePrompt(e.target.value)}
//               sx={{ my: 2 }}
//             />
//             <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
//               <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={generateNames}
//                 disabled={isLoading || !namePrompt}
//                 startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
//               >
//                 Generate Names ✨
//               </Button>
//             </Box>
//             {error && (
//               <Typography color="error" align="center" sx={{ mt: 2 }}>
//                 {error}
//               </Typography>
//             )}
//             {generatedNames.length > 0 && (
//               <Box sx={{ mt: 3 }}>
//                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
//                   Suggested Names:
//                 </Typography>
//                 <List dense>
//                   {generatedNames.map((name, index) => (
//                     <ListItem key={index}>
//                       <ListItemText primary={`• ${name}`} />
//                     </ListItem>
//                   ))}
//                 </List>
//               </Box>
//             )}
//           </Paper>
//         </Box>
        
//         {/* Naming Process Flow Diagram (Redesigned) */}
//         <Box sx={{ my: 4 }}>
//           <Typography variant="h5" align="center" gutterBottom>
//             The Naming Process
//           </Typography>
//           <Box
//             sx={{
//               display: 'flex',
//               flexDirection: { xs: 'column', md: 'row' },
//               alignItems: 'stretch', // ensures equal height
//               justifyContent: 'center',
//               gap: 2,
//             }}
//           >
//             {namingProcess.map((step, index) => (
//               <React.Fragment key={index}>
//                 <Paper
//                   elevation={3}
//                   sx={{
//                     p: 3, // Increased padding
//                     flex: '1',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     justifyContent: 'flex-start', // Top alignment
//                     alignItems: 'flex-start', // Left alignment for icon and text
//                   }}
//                 >
//                   <Box sx={{ color: 'primary.main', mb: 1, alignSelf: 'center' }}>
//                     {step.icon}
//                   </Box>
//                   <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' }, mb: 1 }}>
//                     {step.title}
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
//                     {step.description}
//                   </Typography>
//                 </Paper>
//                 {index < namingProcess.length - 1 && (
//                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', my: { xs: 2, md: 0 } }}>
//                     <ArrowForwardIcon sx={{ fontSize: 50, transform: { xs: 'rotate(90deg)', md: 'rotate(0deg)' } }} />
//                   </Box>
//                 )}
//               </React.Fragment>
//             ))}
//           </Box>
//         </Box>

//         {/* Naming Principles section (Updated to a simple list) */}
//         <Box sx={{ my: 4 }}>
//           <Typography variant="h5" align="center" gutterBottom>
//             Four Basic Principles of Naming
//           </Typography>
//           <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
//             <Grid container spacing={2}>
//               {namingPrinciples.map((principle, index) => (
//                 <Grid item xs={12} md={6} key={index}>
//                   <Typography variant="subtitle1" color="primary">
//                     {index + 1}. {principle.title}
//                   </Typography>
//                   <Typography variant="body2" sx={{ mt: 1 }}>
//                     {principle.description}
//                   </Typography>
//                 </Grid>
//               ))}
//             </Grid>
//           </Paper>
//         </Box>

//         {/* Naming Do's and Don'ts section */}
//         <Box sx={{ my: 4 }}>
//           <Typography variant="h5" align="center" gutterBottom>
//             Do's and Don'ts
//           </Typography>
//           <Grid container spacing={4} alignItems="stretch">
//             <Grid item xs={12} md={6}>
//               <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
//                 <Typography variant="h6" color="success.main" align="center" sx={{ p: 2 }}>
//                   Do
//                 </Typography>
//                 <List dense>
//                   {namingDos.map((item, index) => (
//                     <ListItem key={index}>
//                       <ListItemIcon>
//                         <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main }} />
//                       </ListItemIcon>
//                       <ListItemText primary={item} />
//                     </ListItem>
//                   ))}
//                 </List>
//               </Paper>
//             </Grid>
//             <Grid item xs={12} md={6}>
//               <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
//                 <Typography variant="h6" color="error.main" align="center" sx={{ p: 2 }}>
//                   Don't
//                 </Typography>
//                 <List dense>
//                   {namingDonts.map((item, index) => (
//                     <ListItem key={index}>
//                       <ListItemIcon>
//                         <CancelOutlinedIcon sx={{ color: theme.palette.error.main }} />
//                       </ListItemIcon>
//                       <ListItemText primary={item} />
//                     </ListItem>
//                   ))}
//                 </List>
//               </Paper>
//             </Grid>
//           </Grid>
//         </Box>

//         {/* Naming by Category Table Accordion */}
//         <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
//           <AccordionSummary
//             expandIcon={<ExpandMoreIcon />}
//             aria-controls="panel3a-content"
//             id="panel3a-header"
//           >
//             <Typography variant="h6">Naming by Category</Typography>
//           </AccordionSummary>
//           <AccordionDetails>
//             <TableContainer component={Paper}>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
//                     <TableCell sx={{ fontWeight: 'bold' }}>Naming Approach</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   <TableRow>
//                     <TableCell>Offerings: Capabilities</TableCell>
//                     <TableCell>Descriptive, title case when used as a proper noun (e.g., Cognizant® Cloud Consulting). Sentence case otherwise.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell>Portfolios/Families</TableCell>
//                     <TableCell>Descriptive, title case, always preceded by "Cognizant" on first mention.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell>Offering Components</TableCell>
//                     <TableCell>Descriptive, lowercase. Examples: operating model, solution delivery.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell>Locations & Organizational Units</TableCell>
//                     <TableCell>Purely descriptive, title case. Examples: Cognizant Chennai, Global Onboarding.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell>Internal Publications</TableCell>
//                     <TableCell>Descriptive names only.</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </AccordionDetails>
//         </Accordion>

//         {/* Third-Party Naming Accordion */}
//         <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
//           <AccordionSummary
//             expandIcon={<ExpandMoreIcon />}
//             aria-controls="panel4a-content"
//             id="panel4a-header"
//           >
//             <Typography variant="h6">Third-Party Naming Guidelines</Typography>
//           </AccordionSummary>
//           <AccordionDetails>
//             <List>
//               {thirdPartyGuidelines.map((item, index) => (
//                 <ListItem key={index}>
//                   <ListItemIcon>
//                     <InfoOutlinedIcon color="secondary" />
//                   </ListItemIcon>
//                   <ListItemText primary={item} />
//                 </ListItem>
//               ))}
//             </List>
//           </AccordionDetails>
//         </Accordion>
//       </Container>
//     </ThemeProvider>
//   );
// };

// export default function App() {
//   return (
//     <NamingGuidelines />
//   );
// }

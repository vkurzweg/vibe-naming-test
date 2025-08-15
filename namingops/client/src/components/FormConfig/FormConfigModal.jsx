// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Typography,
//   Box,
//   TextField,
//   Grid,
//   CircularProgress,
//   Alert,
//   IconButton,
//   Divider,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction,
//   Switch,
//   FormControlLabel,
//   Checkbox,
//   Card,
//   CardContent,
//   Tooltip,
// } from '@mui/material';
// import {
//   Close as CloseIcon,
//   Save as SaveIcon,
//   Add as AddIcon,
//   Delete as DeleteIcon,
//   DragIndicator as DragIndicatorIcon,
// } from '@mui/icons-material';
// import { 
//   createFormConfig, 
//   updateFormConfig,
//   activateFormConfig 
// } from '../../features/formConfig/formConfigSlice';

// const FormConfigModal = ({ open, onClose, formConfig = null }) => {
//   const dispatch = useDispatch();
//   const { loading, error } = useSelector((state) => state.formConfig);
  
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     isActive: false,
//     fields: []
//   });
  
//   const [formErrors, setFormErrors] = useState({});
  
//   // Initialize form data when editing an existing form config
//   useEffect(() => {
//     if (formConfig) {
//       setFormData({
//         name: formConfig.name || '',
//         description: formConfig.description || '',
//         isActive: formConfig.isActive || false,
//         fields: formConfig.fields || []
//       });
//       setFormErrors({});
//     } else {
//       // Reset form when creating a new form config
//       setFormData({
//         name: '',
//         description: '',
//         isActive: false,
//         fields: []
//       });
//       setFormErrors({});
//     }
//   }, [formConfig, open]);
  
//   const handleChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
    
//     // Clear error for this field if it exists
//     if (formErrors[field]) {
//       setFormErrors(prev => ({
//         ...prev,
//         [field]: null
//       }));
//     }
//   };
  
//   const handleFieldChange = (index, field, value) => {
//     const updatedFields = [...formData.fields];
//     updatedFields[index] = {
//       ...updatedFields[index],
//       [field]: value
//     };
    
//     setFormData(prev => ({
//       ...prev,
//       fields: updatedFields
//     }));
//   };
  
//   const addField = () => {
//     setFormData(prev => ({
//       ...prev,
//       fields: [
//         ...prev.fields,
//         {
//           name: `field${prev.fields.length + 1}`,
//           label: `Field ${prev.fields.length + 1}`,
//           type: 'text',
//           required: false,
//           fullWidth: true,
//           helperText: '',
//           multiline: false,
//           options: []
//         }
//       ]
//     }));
//   };
  
//   const removeField = (index) => {
//     const updatedFields = [...formData.fields];
//     updatedFields.splice(index, 1);
    
//     setFormData(prev => ({
//       ...prev,
//       fields: updatedFields
//     }));
//   };
  
//   const addOption = (fieldIndex) => {
//     const updatedFields = [...formData.fields];
//     const field = updatedFields[fieldIndex];
    
//     if (!field.options) {
//       field.options = [];
//     }
    
//     field.options.push({
//       value: `option${field.options.length + 1}`,
//       label: `Option ${field.options.length + 1}`
//     });
    
//     setFormData(prev => ({
//       ...prev,
//       fields: updatedFields
//     }));
//   };
  
//   const removeOption = (fieldIndex, optionIndex) => {
//     const updatedFields = [...formData.fields];
//     updatedFields[fieldIndex].options.splice(optionIndex, 1);
    
//     setFormData(prev => ({
//       ...prev,
//       fields: updatedFields
//     }));
//   };
  
//   const handleOptionChange = (fieldIndex, optionIndex, field, value) => {
//     const updatedFields = [...formData.fields];
//     updatedFields[fieldIndex].options[optionIndex] = {
//       ...updatedFields[fieldIndex].options[optionIndex],
//       [field]: value
//     };
    
//     setFormData(prev => ({
//       ...prev,
//       fields: updatedFields
//     }));
//   };
  
//   const validateForm = () => {
//     const errors = {};
//     let isValid = true;
    
//     if (!formData.name.trim()) {
//       errors.name = 'Form name is required';
//       isValid = false;
//     }
    
//     if (formData.fields.length === 0) {
//       errors.fields = 'At least one field is required';
//       isValid = false;
//     }
    
//     // Validate each field has a name and label
//     formData.fields.forEach((field, index) => {
//       if (!field.name.trim()) {
//         errors[`field_${index}_name`] = 'Field name is required';
//         isValid = false;
//       }
      
//       if (!field.label.trim()) {
//         errors[`field_${index}_label`] = 'Field label is required';
//         isValid = false;
//       }
      
//       // Validate select fields have options
//       if (field.type === 'select' && (!field.options || field.options.length === 0)) {
//         errors[`field_${index}_options`] = 'Select fields must have at least one option';
//         isValid = false;
//       }
//     });
    
//     setFormErrors(errors);
//     return isValid;
//   };
  
//   const handleSubmit = () => {
//     if (!validateForm()) return;
    
//     const payload = {
//       ...formData,
//       // Ensure field names are valid for MongoDB (no spaces, lowercase)
//       fields: formData.fields.map(field => ({
//         ...field,
//         name: field.name.trim().toLowerCase().replace(/\s+/g, '_')
//       }))
//     };
    
//     if (formConfig?._id) {
//       // Update existing form config
//       dispatch(updateFormConfig({ id: formConfig._id, formConfig: payload }))
//         .unwrap()
//         .then(() => {
//           // If form is set to active, activate it
//           if (payload.isActive) {
//             dispatch(activateFormConfig(formConfig._id));
//           }
//           onClose();
//         })
//         .catch((error) => {
//           console.error('Error updating form config:', error);
//         });
//     } else {
//       // Create new form config
//       dispatch(createFormConfig(payload))
//         .unwrap()
//         .then((result) => {
//           // If form is set to active, activate it
//           if (payload.isActive && result._id) {
//             dispatch(activateFormConfig(result._id));
//           }
//           onClose();
//         })
//         .catch((error) => {
//           console.error('Error creating form config:', error);
//         });
//     }
//   };
  
//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle>
//         <Box display="flex" justifyContent="space-between" alignItems="center">
//           <Typography variant="h6">
//             {formConfig ? 'Edit Form Configuration' : 'New Form Configuration'}
//           </Typography>
//           <IconButton onClick={onClose} size="small">
//             <CloseIcon />
//           </IconButton>
//         </Box>
//       </DialogTitle>
      
//       <DialogContent>
//         {error && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {error}
//           </Alert>
//         )}
        
//         <Grid container spacing={3}>
//           <Grid item xs={12}>
//             <TextField
//               label="Form Name"
//               value={formData.name}
//               onChange={(e) => handleChange('name', e.target.value)}
//               fullWidth
//               required
//               error={!!formErrors.name}
//               helperText={formErrors.name}
//             />
//           </Grid>
          
//           <Grid item xs={12}>
//             <TextField
//               label="Description"
//               value={formData.description}
//               onChange={(e) => handleChange('description', e.target.value)}
//               fullWidth
//               multiline
//               rows={2}
//             />
//           </Grid>
          
//           <Grid item xs={12}>
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={formData.isActive}
//                   onChange={(e) => handleChange('isActive', e.target.checked)}
//                   color="primary"
//                 />
//               }
//               label="Set as Active Form"
//             />
//             <Typography variant="caption" color="text.secondary" display="block">
//               Only one form can be active at a time. Activating this form will deactivate all others.
//             </Typography>
//           </Grid>
//         </Grid>
        
//         <Divider sx={{ my: 3 }} />
        
//         <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
//           <Typography variant="h6">Form Fields</Typography>
//           <Button
//             variant="outlined"
//             startIcon={<AddIcon />}
//             onClick={addField}
//           >
//             Add Field
//           </Button>
//         </Box>
        
//         {formErrors.fields && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {formErrors.fields}
//           </Alert>
//         )}
        
//         {formData.fields.length === 0 ? (
//           <Alert severity="info" sx={{ mb: 2 }}>
//             No fields added yet. Click &quot;Add Field&quot; to create your form.
//           </Alert>
//         ) : (
//           <List>
//             {formData.fields.map((field, index) => (
//               <Card key={index} sx={{ mb: 2 }}>
//                 <CardContent>
//                   <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                     <Box display="flex" alignItems="center">
//                       <DragIndicatorIcon color="action" sx={{ mr: 1 }} />
//                       <Typography variant="subtitle1" fontWeight={600}>
//                         Field {index + 1}
//                       </Typography>
//                     </Box>
//                     <Tooltip title="Remove Field">
//                       <IconButton
//                         edge="end"
//                         color="error"
//                         onClick={() => removeField(index)}
//                       >
//                         <DeleteIcon />
//                       </IconButton>
//                     </Tooltip>
//                   </Box>
                  
//                   <Grid container spacing={2}>
//                     <Grid item xs={12} sm={6}>
//                       <TextField
//                         label="Field Name"
//                         value={field.name}
//                         onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
//                         fullWidth
//                         required
//                         error={!!formErrors[`field_${index}_name`]}
//                         helperText={formErrors[`field_${index}_name`] || 'No spaces, will be converted to snake_case'}
//                         size="small"
//                       />
//                     </Grid>
                    
//                     <Grid item xs={12} sm={6}>
//                       <TextField
//                         label="Field Label"
//                         value={field.label}
//                         onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
//                         fullWidth
//                         required
//                         error={!!formErrors[`field_${index}_label`]}
//                         helperText={formErrors[`field_${index}_label`] || 'Displayed to users'}
//                         size="small"
//                       />
//                     </Grid>
                    
//                     <Grid item xs={12} sm={6}>
//                       <TextField
//                         select
//                         label="Field Type"
//                         value={field.type}
//                         onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
//                         fullWidth
//                         size="small"
//                         SelectProps={{
//                           native: true,
//                         }}
//                       >
//                         <option value="text">Text</option>
//                         <option value="select">Select</option>
//                       </TextField>
//                     </Grid>
                    
//                     <Grid item xs={12} sm={6}>
//                       <TextField
//                         label="Helper Text"
//                         value={field.helperText || ''}
//                         onChange={(e) => handleFieldChange(index, 'helperText', e.target.value)}
//                         fullWidth
//                         size="small"
//                       />
//                     </Grid>
                    
//                     <Grid item xs={12}>
//                       <Box display="flex" gap={2}>
//                         <FormControlLabel
//                           control={
//                             <Checkbox
//                               checked={field.required || false}
//                               onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
//                             />
//                           }
//                           label="Required"
//                         />
                        
//                         <FormControlLabel
//                           control={
//                             <Checkbox
//                               checked={field.fullWidth || false}
//                               onChange={(e) => handleFieldChange(index, 'fullWidth', e.target.checked)}
//                             />
//                           }
//                           label="Full Width"
//                         />
                        
//                         {field.type === 'text' && (
//                           <FormControlLabel
//                             control={
//                               <Checkbox
//                                 checked={field.multiline || false}
//                                 onChange={(e) => handleFieldChange(index, 'multiline', e.target.checked)}
//                               />
//                             }
//                             label="Multiline"
//                           />
//                         )}
//                       </Box>
//                     </Grid>
                    
//                     {field.type === 'select' && (
//                       <Grid item xs={12}>
//                         <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
//                           <Typography variant="subtitle2">Options</Typography>
//                           <Button
//                             size="small"
//                             startIcon={<AddIcon />}
//                             onClick={() => addOption(index)}
//                           >
//                             Add Option
//                           </Button>
//                         </Box>
                        
//                         {formErrors[`field_${index}_options`] && (
//                           <Alert severity="error" sx={{ mb: 1 }}>
//                             {formErrors[`field_${index}_options`]}
//                           </Alert>
//                         )}
                        
//                         {(!field.options || field.options.length === 0) ? (
//                           <Alert severity="info" sx={{ mb: 1 }}>
//                             No options added yet. Click &quot;Add Option&quot; to create options.
//                           </Alert>
//                         ) : (
//                           <List dense>
//                             {field.options.map((option, optionIndex) => (
//                               <ListItem key={optionIndex} disablePadding>
//                                 <Grid container spacing={2} alignItems="center">
//                                   <Grid item xs={5}>
//                                     <TextField
//                                       label="Value"
//                                       value={option.value}
//                                       onChange={(e) => handleOptionChange(index, optionIndex, 'value', e.target.value)}
//                                       fullWidth
//                                       size="small"
//                                       margin="dense"
//                                     />
//                                   </Grid>
//                                   <Grid item xs={5}>
//                                     <TextField
//                                       label="Label"
//                                       value={option.label}
//                                       onChange={(e) => handleOptionChange(index, optionIndex, 'label', e.target.value)}
//                                       fullWidth
//                                       size="small"
//                                       margin="dense"
//                                     />
//                                   </Grid>
//                                   <Grid item xs={2}>
//                                     <IconButton
//                                       edge="end"
//                                       color="error"
//                                       onClick={() => removeOption(index, optionIndex)}
//                                       size="small"
//                                     >
//                                       <DeleteIcon />
//                                     </IconButton>
//                                   </Grid>
//                                 </Grid>
//                               </ListItem>
//                             ))}
//                           </List>
//                         )}
//                       </Grid>
//                     )}
//                   </Grid>
//                 </CardContent>
//               </Card>
//             ))}
//           </List>
//         )}
//       </DialogContent>
      
//       <DialogActions>
//         <Button onClick={onClose}>Cancel</Button>
//         <Button 
//           variant="contained" 
//           color="primary" 
//           onClick={handleSubmit}
//           disabled={loading}
//           startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
//         >
//           {loading ? 'Saving...' : 'Save Form Configuration'}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default FormConfigModal;

/**
 * ========================================
 * FINANZAPP COLOMBIA - SCRIPT PARA PAREJAS
 * ========================================
 * 
 * Este archivo contiene toda la lógica de funcionalidad para la planificación 
 * financiera en pareja en FinanzApp Colombia.
 * 
 * Funcionalidades principales:
 * - Manejo de entradas duales (nombres y salarios de dos personas)
 * - Cálculo automático del total combinado
 * - Selección de métodos de distribución (50/30/20, 70/20/10, personalizado)
 * - Cálculo de presupuesto conjunto y distribución de gastos
 * - Generación de gráficos con Chart.js
 * - Sistema de consejos financieros específicos para parejas colombianas
 * - Validación de entradas y manejo de errores
 * - Actualización en tiempo real del total combinado
 * 
 * Autor: FinanzApp Colombia
 * Versión: 1.0.0
 * Fecha: 2024
 */

// ========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ========================================

// Variables para almacenar el estado de la aplicación
let selectedMethod = null;           // Método de distribución seleccionado
let currentChart = null;             // Instancia del gráfico actual
let totalCombinedSalary = 0;         // Total combinado de ambos salarios
let person1Data = { name: '', salary: 0 };  // Datos de la primera persona
let person2Data = { name: '', salary: 0 };  // Datos de la segunda persona

// Configuración de métodos predefinidos
const DISTRIBUTION_METHODS = {
    '50-30-20': {
        name: '50/30/20',
        needs: 50,      // Gastos necesarios
        wants: 30,      // Gastos de deseos
        savings: 20     // Ahorro e inversión
    },
    '70-20-10': {
        name: '70/20/10',
        needs: 70,      // Gastos necesarios
        wants: 10,      // Gastos de deseos
        savings: 20     // Ahorro e inversión
    }
};

// ========================================
// CONSEJOS FINANCIEROS PARA PAREJAS COLOMBIANAS
// ========================================

/**
 * Array de consejos financieros específicos para parejas en el contexto colombiano.
 * Cada consejo incluye un título, descripción y categoría.
 */
const COUPLE_FINANCIAL_TIPS = [
    {
        title: "💑 Comunicación Financiera Abierta",
        description: "Mantén conversaciones regulares sobre finanzas. En Colombia, muchas parejas evitan hablar de dinero, pero la transparencia es clave para el éxito financiero conjunto.",
        category: "comunicacion"
    },
    {
        title: "🏠 Vivienda Compartida: Máximo 35% del ingreso total",
        description: "Como pareja, pueden destinar hasta 35% del ingreso combinado a vivienda. Consideren opciones como vivienda VIS, arriendo compartido o compra conjunta.",
        category: "vivienda"
    },
    {
        title: "🚗 Transporte: Evalúen opciones conjuntas",
        description: "Analicen si conviene tener un carro compartido vs transporte público. En Bogotá, TransMilenio + Uber puede ser más económico que mantener un vehículo.",
        category: "transporte"
    },
    {
        title: "🍽️ Alimentación: Cocinen juntos para ahorrar",
        description: "Planifiquen comidas semanales y compren en mercados locales. Cocinar juntos no solo ahorra dinero, sino que fortalece la relación.",
        category: "alimentacion"
    },
    {
        title: "💊 Salud: EPS compartida y seguros complementarios",
        description: "Si ambos trabajan, evalúen cuál EPS tiene mejor cobertura. Consideren un seguro complementario conjunto para mayor protección.",
        category: "salud"
    },
    {
        title: "🎓 Educación: Inviertan en su futuro conjunto",
        description: "Destinen parte del presupuesto a cursos o estudios que beneficien a ambos. La educación es la mejor inversión para el futuro de la pareja.",
        category: "educacion"
    },
    {
        title: "💰 Ahorro Conjunto: Construyan metas compartidas",
        description: "Establezcan metas de ahorro conjuntas: viajes, casa, negocio. Usen cuentas de ahorro programado o fondos de inversión colectiva.",
        category: "ahorro"
    },
    {
        title: "📱 Servicios: Compartan suscripciones",
        description: "Evalúen qué servicios realmente necesitan como pareja. Netflix, Spotify, y otras plataformas ofrecen planes familiares más económicos.",
        category: "servicios"
    },
    {
        title: "🛒 Compras: Tomen decisiones conjuntas",
        description: "Para compras importantes, esperen 24-48 horas y decidan juntos. Eviten compras impulsivas que afecten el presupuesto conjunto.",
        category: "compras"
    },
    {
        title: "💳 Tarjetas: Manejen el crédito responsablemente",
        description: "Si usan tarjetas de crédito, paguen el total cada mes. Las tasas de interés en Colombia son muy altas y pueden afectar su futuro conjunto.",
        category: "credito"
    },
    {
        title: "🎯 Metas Financieras: Planifiquen juntos",
        description: "Definan metas a corto, mediano y largo plazo. Dividan el costo total entre los meses para saber cuánto ahorrar mensualmente como pareja.",
        category: "metas"
    },
    {
        title: "📊 Presupuesto Mensual: Revisen juntos",
        description: "Reúnanse mensualmente para revisar gastos y ajustar el presupuesto. La consistencia es clave para el éxito financiero conjunto.",
        category: "presupuesto"
    }
];

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Formatea un número como moneda colombiana (COP)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda colombiana
 */
function formatCurrency(amount) {
    // Si la cantidad es muy grande, usar formato abreviado
    if (amount >= 1000000000) {
        return `$${(amount / 1000000000).toFixed(1)} mil millones`;
    } else if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)} millones`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)} mil`;
    } else {
        return `$${amount.toLocaleString('es-CO')}`;
    }
}

/**
 * Valida que un valor sea un número válido y mayor que 0
 * @param {string} value - Valor a validar
 * @returns {boolean} True si es válido, false en caso contrario
 */
function isValidNumber(value) {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return !isNaN(num) && num > 0;
}

/**
 * Parsea un valor de entrada y lo convierte a número
 * @param {string} value - Valor de entrada (puede contener comas, puntos, etc.)
 * @returns {number} Número parseado
 */
function parseInputValue(value) {
    // Si el valor está vacío, retornar 0
    if (!value || value.trim() === '') {
        return 0;
    }
    
    // Remover TODOS los caracteres no numéricos (incluyendo comas, puntos, espacios)
    const cleanValue = value.replace(/[^\d]/g, '');
    
    // Convertir a número
    const num = parseInt(cleanValue, 10);
    
    // Verificar si es un número válido
    if (isNaN(num)) {
        return 0;
    }
    
    return num;
}

// ========================================
// MANEJO DE EVENTOS DEL DOM
// ========================================

/**
 * Inicializa todos los event listeners cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FinanzApp Colombia - Script para Parejas inicializado');
    
    // Inicializar event listeners
    initializeEventListeners();
    
    // Configurar validación en tiempo real para los campos de salario
    setupSalaryValidation();
    
    // Configurar validación en tiempo real para los campos de nombres
    setupNameValidation();
});

/**
 * Configura todos los event listeners de la aplicación
 */
function initializeEventListeners() {
    // Event listeners para botones de método de distribución
    const methodButtons = document.querySelectorAll('.method-btn');
    methodButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectDistributionMethod(this.dataset.method);
        });
    });
    
    // Event listener para el botón de cálculo
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateBudget);
    }
    
    // Event listeners para campos personalizados
    const customInputs = ['customNeeds', 'customWants', 'customSavings'];
    customInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', validateCustomPercentages);
        }
    });
}

/**
 * Configura la validación en tiempo real para los campos de salario
 */
function setupSalaryValidation() {
    const salaryInputs = ['person1Salary', 'person2Salary'];
    
    salaryInputs.forEach(inputId => {
        const salaryInput = document.getElementById(inputId);
        if (!salaryInput) return;
        
        // Event listener para entrada de texto
        salaryInput.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Permitir solo números y comas
            const cleanValue = value.replace(/[^\d,]/g, '');
            
            // Prevenir múltiples comas consecutivas
            const formattedValue = cleanValue.replace(/,+/g, ',');
            
            // Prevenir coma al inicio
            const finalValue = formattedValue.startsWith(',') ? formattedValue.substring(1) : formattedValue;
            
            // Actualizar el valor del input
            if (finalValue !== value) {
                e.target.value = finalValue;
            }
            
            // Formatear automáticamente con separadores de miles
            if (finalValue.length > 3) {
                const numValue = parseInputValue(finalValue);
                if (!isNaN(numValue)) {
                    const formatted = numValue.toLocaleString('es-CO');
                    if (formatted !== finalValue) {
                        e.target.value = formatted;
                    }
                }
            }
            
            // Actualizar total combinado
            updateCombinedTotal();
        });
        
        // Event listener para pegar valores
        salaryInput.addEventListener('paste', function(e) {
            e.preventDefault();
            
            // Obtener texto pegado
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            
            // Limpiar y formatear
            const cleanValue = pastedText.replace(/[^\d]/g, '');
            if (cleanValue) {
                const numValue = parseInt(cleanValue);
                if (!isNaN(numValue)) {
                    this.value = numValue.toLocaleString('es-CO');
                    updateCombinedTotal();
                }
            }
        });
    });
}

/**
 * Configura la validación en tiempo real para los campos de nombres
 */
function setupNameValidation() {
    const nameInputs = ['person1Name', 'person2Name'];
    
    nameInputs.forEach(inputId => {
        const nameInput = document.getElementById(inputId);
        if (!nameInput) return;
        
        // Event listener para entrada de texto
        nameInput.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Actualizar etiquetas en tiempo real
            updatePersonLabels();
            
            // Validar que no esté vacío
            if (value.trim() === '') {
                this.classList.add('border-red-300', 'bg-red-50');
            } else {
                this.classList.remove('border-red-300', 'bg-red-50');
                this.classList.add('border-green-300', 'bg-green-50');
            }
        });
    });
}

// ========================================
// ACTUALIZACIÓN DEL TOTAL COMBINADO
// ========================================

/**
 * Actualiza el total combinado de ambos salarios en tiempo real
 */
function updateCombinedTotal() {
    // Obtener valores de los campos de salario
    const person1SalaryInput = document.getElementById('person1Salary');
    const person2SalaryInput = document.getElementById('person2Salary');
    
    if (!person1SalaryInput || !person2SalaryInput) return;
    
    // Parsear valores
    const person1Salary = parseInputValue(person1SalaryInput.value) || 0;
    const person2Salary = parseInputValue(person2SalaryInput.value) || 0;
    
    // Calcular total
    totalCombinedSalary = person1Salary + person2Salary;
    
    // Actualizar datos de las personas
    person1Data.salary = person1Salary;
    person2Data.salary = person2Salary;
    
    // Actualizar UI
    const totalElement = document.getElementById('totalCombined');
    if (totalElement) {
        totalElement.textContent = formatCurrency(totalCombinedSalary);
        
        // Aplicar estilos según el valor
        if (totalCombinedSalary > 0) {
            totalElement.classList.remove('text-slate-400');
            totalElement.classList.add('text-primary-600');
        } else {
            totalElement.classList.remove('text-primary-600');
            totalElement.classList.add('text-slate-400');
        }
    }
    
    console.log(`💰 Total combinado actualizado: ${formatCurrency(totalCombinedSalary)}`);
}

/**
 * Actualiza las etiquetas de las personas con sus nombres
 */
function updatePersonLabels() {
    const person1Name = document.getElementById('person1Name')?.value || 'Persona 1';
    const person2Name = document.getElementById('person2Name')?.value || 'Persona 2';
    
    // Actualizar datos de las personas
    person1Data.name = person1Name;
    person2Data.name = person2Name;
    
    // Actualizar etiquetas en la UI
    const person1Label = document.getElementById('person1Label');
    const person2Label = document.getElementById('person2Label');
    
    if (person1Label) person1Label.textContent = person1Name;
    if (person2Label) person2Label.textContent = person2Name;
}

// ========================================
// LÓGICA DE SELECCIÓN DE MÉTODOS
// ========================================

/**
 * Selecciona un método de distribución y actualiza la UI
 * @param {string} method - Método seleccionado ('50-30-20', '70-20-10', 'custom')
 */
function selectDistributionMethod(method) {
    // Remover selección previa
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('border-primary-500', 'bg-primary-50');
        btn.classList.add('border-slate-200', 'bg-white');
    });
    
    // Seleccionar el botón actual
    const selectedButton = document.querySelector(`[data-method="${method}"]`);
    if (selectedButton) {
        selectedButton.classList.remove('border-slate-200', 'bg-white');
        selectedButton.classList.add('border-primary-500', 'bg-primary-50');
    }
    
    // Actualizar método seleccionado
    selectedMethod = method;
    
    // Mostrar/ocultar campos personalizados
    toggleCustomInputs(method === 'custom');
    
    console.log(`✅ Método seleccionado: ${method}`);
}

/**
 * Muestra u oculta los campos de entrada personalizada
 * @param {boolean} show - True para mostrar, false para ocultar
 */
function toggleCustomInputs(show) {
    const customInputs = document.getElementById('customInputs');
    if (customInputs) {
        if (show) {
            customInputs.classList.remove('hidden');
            // Establecer valores por defecto
            document.getElementById('customNeeds').value = '50';
            document.getElementById('customWants').value = '30';
            document.getElementById('customSavings').value = '20';
        } else {
            customInputs.classList.add('hidden');
        }
    }
}

// ========================================
// VALIDACIÓN DE PORCENTAJES PERSONALIZADOS
// ========================================

/**
 * Valida que los porcentajes personalizados sumen 100%
 */
function validateCustomPercentages() {
    const needs = parseInt(document.getElementById('customNeeds').value) || 0;
    const wants = parseInt(document.getElementById('customWants').value) || 0;
    const savings = parseInt(document.getElementById('customSavings').value) || 0;
    
    const total = needs + wants + savings;
    
    // Obtener elementos de input para aplicar estilos de validación
    const inputs = ['customNeeds', 'customWants', 'customSavings'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            if (total === 100) {
                input.classList.remove('border-red-500', 'bg-red-50');
                input.classList.add('border-green-500', 'bg-green-50');
            } else {
                input.classList.remove('border-green-500', 'bg-green-50');
                input.classList.add('border-red-500', 'bg-red-50');
            }
        }
    });
    
    // Mostrar mensaje de validación
    const validationMessage = document.getElementById('validationMessage') || createValidationMessage();
    if (total === 100) {
        validationMessage.textContent = '✅ Porcentajes válidos (suman 100%)';
        validationMessage.className = 'text-green-600 text-sm text-center mt-2';
    } else {
        validationMessage.textContent = `⚠️ Los porcentajes deben sumar 100% (actual: ${total}%)`;
        validationMessage.className = 'text-red-600 text-sm text-center mt-2';
    }
}

/**
 * Crea el mensaje de validación si no existe
 * @returns {HTMLElement} Elemento del mensaje de validación
 */
function createValidationMessage() {
    const customInputs = document.getElementById('customInputs');
    const message = document.createElement('div');
    message.id = 'validationMessage';
    message.className = 'text-sm text-center mt-2';
    customInputs.appendChild(message);
    return message;
}

// ========================================
// CÁLCULO DEL PRESUPUESTO
// ========================================

/**
 * Función principal para calcular el presupuesto
 */
function calculateBudget() {
    // Validar que se hayan ingresado nombres
    const person1Name = document.getElementById('person1Name')?.value.trim();
    const person2Name = document.getElementById('person2Name')?.value.trim();
    
    if (!person1Name || !person2Name) {
        showError('Por favor, ingresa los nombres de ambas personas');
        return;
    }
    
    // Validar que se hayan ingresado salarios
    if (totalCombinedSalary <= 0) {
        showError('Por favor, ingresa los salarios de ambas personas');
        return;
    }
    
    // Validar que se haya seleccionado un método
    if (!selectedMethod) {
        showError('Por favor, selecciona un método de distribución');
        return;
    }
    
    // Validar porcentajes personalizados si es necesario
    if (selectedMethod === 'custom') {
        const needs = parseInt(document.getElementById('customNeeds').value) || 0;
        const wants = parseInt(document.getElementById('customWants').value) || 0;
        const savings = parseInt(document.getElementById('customSavings').value) || 0;
        
        if (needs + wants + savings !== 100) {
            showError('Los porcentajes personalizados deben sumar 100%');
            return;
        }
    }
    
    // Calcular distribución
    const distribution = calculateDistribution();
    
    console.log('🔍 Debug - Distribución calculada:', distribution);
    
    // Mostrar resultados
    displayResults(distribution);
    
    // Mostrar sección de resultados (asegura que el canvas esté visible antes de inicializar Chart.js)
    showResults();
    
    // Generar gráfico
    generateChart(distribution);
    
    // Forzar un resize en el siguiente frame por si el layout tarda en estabilizarse
    requestAnimationFrame(() => { if (currentChart) currentChart.resize(); });
    
    // Mostrar consejos
    displayTips();
    
    console.log('💰 Presupuesto en pareja calculado exitosamente');
}

/**
 * Calcula la distribución del presupuesto según el método seleccionado
 * @returns {Object} Objeto con la distribución calculada
 */
function calculateDistribution() {
    let needs, wants, savings;
    
    if (selectedMethod === 'custom') {
        needs = parseInt(document.getElementById('customNeeds').value);
        wants = parseInt(document.getElementById('customWants').value);
        savings = parseInt(document.getElementById('customSavings').value);
    } else {
        const method = DISTRIBUTION_METHODS[selectedMethod];
        needs = method.needs;
        wants = method.wants;
        savings = method.savings;
    }
    
    return {
        needs: {
            percentage: needs,
            amount: (totalCombinedSalary * needs) / 100
        },
        wants: {
            percentage: wants,
            amount: (totalCombinedSalary * wants) / 100
        },
        savings: {
            percentage: savings,
            amount: (totalCombinedSalary * savings) / 100
        }
    };
}

// ========================================
// VISUALIZACIÓN DE RESULTADOS
// ========================================

/**
 * Muestra los resultados del cálculo en la UI
 * @param {Object} distribution - Distribución calculada
 */
function displayResults(distribution) {
    // Actualizar montos
    document.getElementById('needsAmount').textContent = formatCurrency(distribution.needs.amount);
    document.getElementById('wantsAmount').textContent = formatCurrency(distribution.wants.amount);
    document.getElementById('savingsAmount').textContent = formatCurrency(distribution.savings.amount);
    
    // Actualizar porcentajes
    document.getElementById('needsPercentage').textContent = `${distribution.needs.percentage}%`;
    document.getElementById('wantsPercentage').textContent = `${distribution.wants.percentage}%`;
    document.getElementById('savingsPercentage').textContent = `${distribution.savings.percentage}%`;
}

/**
 * Genera el gráfico de distribución usando Chart.js
 * @param {Object} distribution - Distribución calculada
 */
function generateChart(distribution) {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Crear nuevo gráfico
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gastos Necesarios', 'Gastos Deseos', 'Ahorro e Inversión'],
            datasets: [{
                data: [
                    distribution.needs.amount,
                    distribution.wants.amount,
                    distribution.savings.amount
                ],
                backgroundColor: [
                    '#ef4444', // Rojo para necesidades
                    '#22c55e', // Verde para deseos
                    '#3b82f6'  // Azul para ahorro
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / totalCombinedSalary) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

/**
 * Muestra consejos financieros aleatorios para parejas
 */
function displayTips() {
    const tipsGrid = document.getElementById('tipsGrid');
    if (!tipsGrid) return;
    
    // Limpiar consejos anteriores
    tipsGrid.innerHTML = '';
    
    // Seleccionar 6 consejos aleatorios (más consejos para parejas)
    const selectedTips = getRandomTips(6);
    
    // Crear elementos HTML para cada consejo
    selectedTips.forEach(tip => {
        const tipElement = document.createElement('div');
        tipElement.className = 'bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200';
        tipElement.innerHTML = `
            <h4 class="text-lg font-semibold text-slate-800 mb-3">${tip.title}</h4>
            <p class="text-slate-600 text-sm leading-relaxed">${tip.description}</p>
        `;
        tipsGrid.appendChild(tipElement);
    });
}

/**
 * Obtiene consejos aleatorios del array de consejos para parejas
 * @param {number} count - Número de consejos a obtener
 * @returns {Array} Array de consejos aleatorios
 */
function getRandomTips(count) {
    const shuffled = [...COUPLE_FINANCIAL_TIPS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// ========================================
// MANEJO DE LA UI
// ========================================

/**
 * Muestra la sección de resultados
 */
function showResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
        
        // Scroll suave a los resultados
        resultsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error a mostrar
 */
function showError(message) {
    // Crear o actualizar mensaje de error
    let errorElement = document.getElementById('errorMessage');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center';
        
        // Insertar después del formulario
        const form = document.querySelector('.bg-white.rounded-3xl');
        if (form) {
            form.parentNode.insertBefore(errorElement, form.nextSibling);
        }
    }
    
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
    
    console.error(`❌ Error: ${message}`);
}

// ========================================
// FUNCIONES DE RESET Y LIMPIEZA
// ========================================

/**
 * Resetea la aplicación a su estado inicial
 */
function resetApplication() {
    // Limpiar campos de entrada
    const inputs = ['person1Name', 'person2Name', 'person1Salary', 'person2Salary'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) input.value = '';
    });
    
    // Resetear datos de las personas
    person1Data = { name: '', salary: 0 };
    person2Data = { name: '', salary: 0 };
    totalCombinedSalary = 0;
    
    // Resetear método seleccionado
    selectedMethod = null;
    
    // Limpiar selección de botones
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('border-primary-500', 'bg-primary-50');
        btn.classList.add('border-slate-200', 'bg-white');
    });
    
    // Ocultar campos personalizados
    toggleCustomInputs(false);
    
    // Ocultar resultados
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    
    // Destruir gráfico
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    
    // Limpiar mensajes de error
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
    
    // Resetear total combinado
    const totalElement = document.getElementById('totalCombined');
    if (totalElement) {
        totalElement.textContent = '$0';
        totalElement.classList.remove('text-primary-600');
        totalElement.classList.add('text-slate-400');
    }
    
    // Resetear etiquetas
    updatePersonLabels();
    
    console.log('🔄 Aplicación para parejas reseteada');
}

// ========================================
// EXPORTACIÓN DE FUNCIONES (para debugging)
// ========================================

// Hacer funciones disponibles globalmente para debugging
window.FinanzAppParejas = {
    reset: resetApplication,
    calculate: calculateBudget,
    formatCurrency: formatCurrency,
    parseInputValue: parseInputValue,
    updateCombinedTotal: updateCombinedTotal,
    updatePersonLabels: updatePersonLabels
};

console.log('🎯 FinanzApp Colombia - Funciones para parejas disponibles en window.FinanzAppParejas');

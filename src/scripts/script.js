/**
 * ========================================
 * FINANZAPP COLOMBIA - SCRIPT INDIVIDUAL
 * ========================================
 * 
 * Este archivo contiene toda la lógica de funcionalidad para la planificación 
 * financiera individual en FinanzApp Colombia.
 * 
 * Funcionalidades principales:
 * - Manejo de entrada de salario con formato colombiano
 * - Selección de métodos de distribución (50/30/20, 70/20/10, personalizado)
 * - Cálculo de presupuesto y distribución de gastos
 * - Generación de gráficos con Chart.js
 * - Sistema de consejos financieros contextualizados para Colombia
 * - Validación de entradas y manejo de errores
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
let salaryAmount = 0;                // Monto del salario ingresado

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
// CONSEJOS FINANCIEROS PARA COLOMBIA
// ========================================

/**
 * Array de consejos financieros específicos para el contexto colombiano.
 * Cada consejo incluye un título, descripción y categoría.
 */
const FINANCIAL_TIPS = [
    {
        title: "🏠 Vivienda: Máximo 30% del ingreso",
        description: "En Colombia, destinar más del 30% a vivienda puede comprometer tu estabilidad financiera. Considera opciones como arriendo compartido o vivienda VIS.",
        category: "vivienda"
    },
    {
        title: "🚌 Transporte: Optimiza tus gastos",
        description: "Usa TransMilenio, SITP o bicicleta en Bogotá. En otras ciudades, evalúa si conviene tener carro vs transporte público según tu ubicación.",
        category: "transporte"
    },
    {
        title: "🍽️ Alimentación: Planifica tus compras",
        description: "Compra en mercados locales, aprovecha ofertas de supermercados y cocina en casa. Evita comer fuera más de 2-3 veces por semana.",
        category: "alimentacion"
    },
    {
        title: "💊 Salud: Prioriza tu bienestar",
        description: "Mantén tu EPS al día y considera un seguro complementario. Invierte en prevención: ejercicio, buena alimentación y chequeos regulares.",
        category: "salud"
    },
    {
        title: "🎓 Educación: Invierte en tu futuro",
        description: "Destina parte de tu presupuesto a cursos, certificaciones o estudios que mejoren tu perfil profesional y aumenten tus ingresos futuros.",
        category: "educacion"
    },
    {
        title: "💰 Ahorro: Construye tu colchón",
        description: "Ahorra al menos 3-6 meses de gastos en tu fondo de emergencia. Considera CDT, fondos de inversión colectiva o cuentas de ahorro programado.",
        category: "ahorro"
    },
    {
        title: "📱 Servicios: Revisa tus suscripciones",
        description: "Evalúa si realmente necesitas Netflix, Spotify Premium, y otras suscripciones. Cancela las que no uses regularmente.",
        category: "servicios"
    },
    {
        title: "🛒 Compras: Evita el impulso",
        description: "Antes de comprar, espera 24 horas. Pregúntate si realmente lo necesitas y si puedes pagarlo sin afectar tu presupuesto mensual.",
        category: "compras"
    },
    {
        title: "💳 Tarjetas: Usa el crédito inteligentemente",
        description: "Paga el total de tus tarjetas cada mes. Si no puedes, no uses crédito. Las tasas de interés en Colombia son muy altas.",
        category: "credito"
    },
    {
        title: "🎯 Metas: Define objetivos claros",
        description: "Establece metas financieras específicas: viaje, casa, negocio. Divide el costo total entre los meses para saber cuánto ahorrar mensualmente.",
        category: "metas"
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
    console.log('🚀 FinanzApp Colombia - Script Individual inicializado');
    
    // Inicializar event listeners
    initializeEventListeners();
    
    // Configurar validación en tiempo real para el campo de salario
    setupSalaryValidation();
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
 * Configura la validación en tiempo real para el campo de salario
 */
function setupSalaryValidation() {
    const salaryInput = document.getElementById('salary');
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
            }
        }
    });
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
    // Validar que se haya ingresado un salario
    const salaryInput = document.getElementById('salary');
    if (!salaryInput || !salaryInput.value.trim()) {
        showError('Por favor, ingresa tu salario mensual');
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
    
    // Parsear el salario
    const rawValue = salaryInput.value;
    console.log('🔍 Debug - Valor original del input:', rawValue);
    console.log('🔍 Debug - Tipo del valor original:', typeof rawValue);
    
    salaryAmount = parseInputValue(rawValue);
    
    console.log('🔍 Debug - Valor después de parseInputValue:', salaryAmount);
    console.log('🔍 Debug - Tipo de dato después de parse:', typeof salaryAmount);
    console.log('🔍 Debug - ¿Es NaN?', isNaN(salaryAmount));
    console.log('🔍 Debug - ¿Es mayor que 0?', salaryAmount > 0);
    
    if (isNaN(salaryAmount) || salaryAmount <= 0) {
        showError('Por favor, ingresa un salario válido');
        return;
    }
    
    // Calcular distribución
    const distribution = calculateDistribution();
    
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
    
    console.log('💰 Presupuesto calculado exitosamente');
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
            amount: (salaryAmount * needs) / 100
        },
        wants: {
            percentage: wants,
            amount: (salaryAmount * wants) / 100
        },
        savings: {
            percentage: savings,
            amount: (salaryAmount * savings) / 100
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
                            const percentage = ((value / salaryAmount) * 100).toFixed(1);
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
 * Muestra consejos financieros aleatorios
 */
function displayTips() {
    const tipsGrid = document.getElementById('tipsGrid');
    if (!tipsGrid) return;
    
    // Limpiar consejos anteriores
    tipsGrid.innerHTML = '';
    
    // Seleccionar 4 consejos aleatorios
    const selectedTips = getRandomTips(4);
    
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
 * Obtiene consejos aleatorios del array de consejos
 * @param {number} count - Número de consejos a obtener
 * @returns {Array} Array de consejos aleatorios
 */
function getRandomTips(count) {
    const shuffled = [...FINANCIAL_TIPS].sort(() => 0.5 - Math.random());
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
    const salaryInput = document.getElementById('salary');
    if (salaryInput) salaryInput.value = '';
    
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
    
    console.log('🔄 Aplicación reseteada');
}

// ========================================
// EXPORTACIÓN DE FUNCIONES (para debugging)
// ========================================

// Hacer funciones disponibles globalmente para debugging
window.FinanzApp = {
    reset: resetApplication,
    calculate: calculateBudget,
    formatCurrency: formatCurrency,
    parseInputValue: parseInputValue
};

console.log('🎯 FinanzApp Colombia - Funciones disponibles en window.FinanzApp');

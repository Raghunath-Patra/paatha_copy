// Enhanced HTMLContentRenderer component
import { useEffect, useRef } from 'react';

interface HTMLContentRendererProps {
  htmlContent: string;
  className?: string;
  style?: React.CSSProperties;
}

const HTMLContentRenderer: React.FC<HTMLContentRendererProps> = ({
  htmlContent,
  className = "",
  style = {}
}: HTMLContentRendererProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const stylesRef = useRef<Set<string>>(new Set());
  const scriptsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    // Clear previous content
    contentRef.current.innerHTML = '';
    
    // Clean up previous styles and scripts
    stylesRef.current.forEach((styleId: string) => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    });
    stylesRef.current.clear();
    scriptsRef.current.clear();

    // Parse the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract and handle styles
    const styleElements = doc.querySelectorAll('style');
    styleElements.forEach((styleEl, index) => {
      const styleContent = styleEl.textContent || styleEl.innerHTML;
      if (styleContent.trim()) {
        const styleId = `injected-style-${Date.now()}-${index}`;
        const newStyle = document.createElement('style');
        newStyle.id = styleId;
        newStyle.textContent = styleContent;
        document.head.appendChild(newStyle);
        stylesRef.current.add(styleId);
      }
      // Remove from the document to avoid duplication
      styleEl.remove();
    });

    // Extract and handle scripts
    const scriptElements = doc.querySelectorAll('script');
    const scriptsToExecute: { content: string; src?: string }[] = [];
    
    scriptElements.forEach((scriptEl) => {
      const src = scriptEl.getAttribute('src');
      const content = scriptEl.textContent || scriptEl.innerHTML;
      
      if (src) {
        // External script
        scriptsToExecute.push({ content: '', src });
      } else if (content.trim()) {
        // Inline script
        scriptsToExecute.push({ content });
      }
      
      // Remove from the document
      scriptEl.remove();
    });

    // Insert the cleaned HTML content
    const bodyContent = doc.body.innerHTML || htmlContent;
    contentRef.current.innerHTML = bodyContent;

    // Execute scripts after DOM is ready
    const executeScripts = async () => {
      for (const script of scriptsToExecute) {
        try {
          if (script.src) {
            // Load external script
            await loadExternalScript(script.src);
          } else if (script.content) {
            // Execute inline script
            executeInlineScript(script.content);
          }
        } catch (error: unknown) {
          console.warn('Error executing script:', error);
        }
      }
    };

    // Small delay to ensure DOM is fully rendered
    setTimeout(executeScripts, 100);

    // Cleanup function
    return () => {
      stylesRef.current.forEach((styleId: string) => {
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
      });
    };
  }, [htmlContent]);

  // Function to load external scripts
  const loadExternalScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (scriptsRef.current.has(src)) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        scriptsRef.current.add(src);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = (): void => {
        scriptsRef.current.add(src);
        resolve();
      };
      script.onerror = (): void => {
        console.warn(`Failed to load script: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      document.head.appendChild(script);
    });
  };

  // Function to execute inline scripts safely
  const executeInlineScript = (scriptContent: string): void => {
    try {
      // Create a new script element for execution
      const script = document.createElement('script');
      script.textContent = scriptContent;
      
      // Execute in the context of the content container
      if (contentRef.current) {
        contentRef.current.appendChild(script);
        // Remove immediately after execution
        contentRef.current.removeChild(script);
      }
    } catch (error: unknown) {
      console.warn('Error executing inline script:', error);
      
      // Fallback: try direct evaluation
      try {
        // Create a scope that includes common DOM references
        const func = new Function('document', 'window', 'console', scriptContent);
        func(document, window, console);
      } catch (evalError: unknown) {
        console.warn('Error in script evaluation fallback:', evalError);
      }
    }
  };

  return (
    <div 
      ref={contentRef}
      className={className}
      style={style}
    />
  );
};

export default HTMLContentRenderer;
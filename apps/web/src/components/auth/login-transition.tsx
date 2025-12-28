/**
 * Login Transition Component
 * @description Premium animated transition shown after successful login.
 * Features a cosmic portal effect with particle animation and smooth reveal.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

interface LoginTransitionProps {
    isActive: boolean;
    onComplete: () => void;
    isDataLoaded: boolean;
}

// Generate random particles for the animation
function generateParticles(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 0.5,
        duration: Math.random() * 1 + 1.5,
    }));
}

export function LoginTransition({ isActive, onComplete, isDataLoaded }: LoginTransitionProps) {
    const [phase, setPhase] = useState<'particles' | 'portal' | 'reveal' | 'complete'>('particles');
    const particles = useMemo(() => generateParticles(30), []);

    // Reset phase when transition is cancelled
    useEffect(() => {
        if (!isActive) {
            setPhase('particles');
        }
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        // Phase 1: Particles converge (1.5s)
        const particleTimer = setTimeout(() => {
            setPhase('portal');
        }, 1500);

        // Phase 2: Portal opens (1s) - Wait for data if needed
        const portalTimer = setTimeout(() => {
            if (isDataLoaded) {
                setPhase('reveal');
            }
        }, 2500);

        return () => {
            clearTimeout(particleTimer);
            clearTimeout(portalTimer);
        };
    }, [isActive, isDataLoaded]);

    // When data arrives late, transition to reveal
    useEffect(() => {
        if (phase === 'portal' && isDataLoaded) {
            const timer = setTimeout(() => setPhase('reveal'), 300);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [phase, isDataLoaded]);

    // Phase 3: Reveal complete
    useEffect(() => {
        if (phase === 'reveal') {
            const timer = setTimeout(() => {
                setPhase('complete');
                onComplete();
            }, 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [phase, onComplete]);

    if (!isActive && phase === 'complete') return null;

    return (
        <AnimatePresence>
            {isActive && phase !== 'complete' && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Dark backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />

                    {/* Floating particles */}
                    {phase === 'particles' && particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute rounded-full bg-primary/60"
                            style={{
                                width: particle.size,
                                height: particle.size,
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                boxShadow: `0 0 ${particle.size * 2}px ${particle.size}px hsl(var(--primary) / 0.3)`,
                            }}
                            initial={{
                                opacity: 0,
                                scale: 0,
                            }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0, 1, 1, 0],
                                x: `calc(50vw - ${particle.x}vw)`,
                                y: `calc(50vh - ${particle.y}vh)`,
                            }}
                            transition={{
                                duration: particle.duration,
                                delay: particle.delay,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        />
                    ))}

                    {/* Converging particles during portal phase */}
                    {phase === 'portal' && (
                        <>
                            {/* Orbiting particles */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={`orbit-${i}`}
                                    className="absolute rounded-full bg-primary"
                                    style={{
                                        width: 6,
                                        height: 6,
                                        boxShadow: '0 0 20px 8px hsl(var(--primary) / 0.4)',
                                    }}
                                    initial={{
                                        x: Math.cos((i / 8) * Math.PI * 2) * 200,
                                        y: Math.sin((i / 8) * Math.PI * 2) * 200,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        y: 0,
                                        opacity: [0, 1, 1, 0],
                                        scale: [1, 1.5, 0],
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        delay: i * 0.05,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {/* Portal glow effect */}
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
                        }}
                        initial={{ width: 0, height: 0, opacity: 0 }}
                        animate={
                            phase === 'portal' || phase === 'reveal'
                                ? {
                                    width: ['0px', '300px', phase === 'reveal' ? '4000px' : '300px'],
                                    height: ['0px', '300px', phase === 'reveal' ? '4000px' : '300px'],
                                    opacity: [0, 0.8, phase === 'reveal' ? 0 : 0.8],
                                }
                                : {}
                        }
                        transition={{
                            duration: phase === 'reveal' ? 1 : 0.6,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    />

                    {/* Central portal ring */}
                    <motion.div
                        className="absolute rounded-full border-2 border-primary/50"
                        style={{
                            boxShadow: '0 0 60px 20px hsl(var(--primary) / 0.2), inset 0 0 60px 20px hsl(var(--primary) / 0.1)',
                        }}
                        initial={{ width: 0, height: 0, opacity: 0 }}
                        animate={
                            phase === 'portal'
                                ? {
                                    width: 200,
                                    height: 200,
                                    opacity: 1,
                                    rotate: 360,
                                }
                                : phase === 'reveal'
                                    ? {
                                        width: 3000,
                                        height: 3000,
                                        opacity: 0,
                                        rotate: 720,
                                    }
                                    : {}
                        }
                        transition={{
                            duration: phase === 'reveal' ? 1 : 0.5,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    />

                    {/* Inner portal ring */}
                    <motion.div
                        className="absolute rounded-full border border-primary/30"
                        initial={{ width: 0, height: 0, opacity: 0 }}
                        animate={
                            phase === 'portal'
                                ? {
                                    width: 140,
                                    height: 140,
                                    opacity: 1,
                                    rotate: -360,
                                }
                                : phase === 'reveal'
                                    ? {
                                        width: 2000,
                                        height: 2000,
                                        opacity: 0,
                                        rotate: -720,
                                    }
                                    : {}
                        }
                        transition={{
                            duration: phase === 'reveal' ? 1 : 0.5,
                            delay: 0.1,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    />

                    {/* Logo container */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={
                            phase === 'portal'
                                ? { opacity: 1, scale: 1 }
                                : phase === 'reveal'
                                    ? { opacity: 0, scale: 1.5 }
                                    : {}
                        }
                        transition={{
                            duration: 0.5,
                            delay: phase === 'portal' ? 0.2 : 0,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {/* Logo icon */}
                        <motion.div
                            className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center"
                            style={{
                                boxShadow: '0 0 40px 15px hsl(var(--primary) / 0.3)',
                            }}
                            animate={{
                                boxShadow: [
                                    '0 0 40px 15px hsl(var(--primary) / 0.3)',
                                    '0 0 60px 25px hsl(var(--primary) / 0.4)',
                                    '0 0 40px 15px hsl(var(--primary) / 0.3)',
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            <svg
                                className="h-12 w-12 text-primary-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                        </motion.div>

                        {/* Loading text */}
                        <motion.p
                            className="text-sm text-slate-400 font-medium"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {isDataLoaded ? 'Welcome!' : 'Preparing your workspace...'}
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

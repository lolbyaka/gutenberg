/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import {
	Disabled,
	IconButton,
	PanelBody,
	Path,
	Rect,
	SelectControl,
	SVG,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	RichText,
} from '@wordpress/block-editor';
import { mediaUpload } from '@wordpress/editor';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './icon';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

class AudioEdit extends Component {
	constructor() {
		super( ...arguments );
		// edit component has its own src in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			editing: ! this.props.attributes.src,
		};

		this.toggleAttribute = this.toggleAttribute.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
	}

	componentDidMount() {
		const { attributes, noticeOperations, setAttributes } = this.props;
		const { id, src = '' } = attributes;

		if ( ! id && isBlobURL( src ) ) {
			const file = getBlobByURL( src );

			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ { id: mediaId, url } ] ) => {
						setAttributes( { id: mediaId, src: url } );
					},
					onError: ( e ) => {
						setAttributes( { src: undefined, id: undefined } );
						this.setState( { editing: true } );
						noticeOperations.createErrorNotice( e );
					},
					allowedTypes: ALLOWED_MEDIA_TYPES,
				} );
			}
		}
	}

	toggleAttribute( attribute ) {
		return ( newValue ) => {
			this.props.setAttributes( { [ attribute ]: newValue } );
		};
	}

	onSelectURL( newSrc ) {
		const { attributes, setAttributes } = this.props;
		const { src } = attributes;

		// Set the block's src from the edit component's state, and switch off
		// the editing UI.
		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock(
				{ attributes: { url: newSrc } }
			);
			if ( undefined !== embedBlock ) {
				this.props.onReplace( embedBlock );
				return;
			}
			setAttributes( { src: newSrc, id: undefined } );
		}

		this.setState( { editing: false } );
	}

	render() {
		const { autoplay, caption, loop, preload, src } = this.props.attributes;
		const { setAttributes, isSelected, className, noticeOperations, noticeUI } = this.props;
		const { editing } = this.state;
		const switchToEditing = () => {
			this.setState( { editing: true } );
		};
		const onSelectAudio = ( media ) => {
			if ( ! media || ! media.url ) {
				// in this case there was an error and we should continue in the editing state
				// previous attributes should be removed because they may be temporary blob urls
				setAttributes( { src: undefined, id: undefined } );
				switchToEditing();
				return;
			}
			// sets the block's attribute and updates the edit component from the
			// selected media, then switches off the editing UI
			setAttributes( { src: media.url, id: media.id } );
			this.setState( { src: media.url, editing: false } );
		};
		if ( editing ) {
			return (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					className={ className }
					onSelect={ onSelectAudio }
					onSelectURL={ this.onSelectURL }
					accept="audio/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ this.props.attributes }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
				/>
			);
		}

		const editImageIcon = ( <SVG width={ 20 } height={ 20 } viewBox="0 0 20 20"><Rect x={ 11 } y={ 3 } width={ 7 } height={ 5 } rx={ 1 } /><Rect x={ 2 } y={ 12 } width={ 7 } height={ 5 } rx={ 1 } /><Path d="M13,12h1a3,3,0,0,1-3,3v2a5,5,0,0,0,5-5h1L15,9Z" /><Path d="M4,8H3l2,3L7,8H6A3,3,0,0,1,9,5V3A5,5,0,0,0,4,8Z" /></SVG> );
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit audio' ) }
							onClick={ switchToEditing }
							icon={ editImageIcon }
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Audio Settings' ) }>
						<ToggleControl
							label={ __( 'Autoplay' ) }
							onChange={ this.toggleAttribute( 'autoplay' ) }
							checked={ autoplay }
						/>
						<ToggleControl
							label={ __( 'Loop' ) }
							onChange={ this.toggleAttribute( 'loop' ) }
							checked={ loop }
						/>
						<SelectControl
							label={ __( 'Preload' ) }
							value={ undefined !== preload ? preload : 'none' }
							// `undefined` is required for the preload attribute to be unset.
							onChange={ ( value ) => setAttributes( { preload: ( 'none' !== value ) ? value : undefined } ) }
							options={ [
								{ value: 'auto', label: __( 'Auto' ) },
								{ value: 'metadata', label: __( 'Metadata' ) },
								{ value: 'none', label: __( 'None' ) },
							] }
						/>
					</PanelBody>
				</InspectorControls>
				<figure className={ className }>
					{ /*
						Disable the audio tag so the user clicking on it won't play the
						file or change the position slider when the controls are enabled.
					*/ }
					<Disabled>
						<audio controls="controls" src={ src } />
					</Disabled>
					{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) }
				</figure>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default withNotices( AudioEdit );
